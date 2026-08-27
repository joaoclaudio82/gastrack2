"""
Benchmark sintetico de prova de conceito — deteccao nao supervisionada
de anomalias em janelas de pressao (Artigo 2 / GasTrack).

Correcoes em relacao a versao avaliada pelos revisores:
  * remove a amplitude duplicada (11 atributos, nao 12);
  * separa treino / calibracao / teste (LOF novelty=True nunca e pontuado no ajuste);
  * limiar unico: percentil 99 dos escores no conjunto NORMAL de CALIBRACAO;
  * contamination do sklearn NAO e usada na decisao final;
  * 20 sementes independentes, media, desvio-padrao e IC95%;
  * FPR, especificidade, PR-AUC e PPV em prevalencias realistas;
  * recall por mecanismo para os quatro detectores;
  * ablacao, severidade, OOD, janelas 12/24/48, sobreposicao e custo.

Uso:
    python experimento_anomalias.py
    python experimento_anomalias.py --sementes 20 --sementes-extra 5
"""

from __future__ import annotations

import argparse
import json
import pickle
import sys
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM

# ---------------------------------------------------------------- parametros
DT_MIN = 5.0
DT_H = DT_MIN / 60.0
N_JANELA = 24                      # 24 amostras; span = 23*5 = 115 min
N_TRAIN = 5000
N_CAL = 2000
N_TEST_NORM = 2500
N_POR_TIPO = 500
LIMIAR_PERCENTIL = 99.0
K_LOF = 35                         # ponto medio do intervalo 10-50 de Breunig
NU_OCSVM = 0.01                    # orcamento nominal de 1% de falso alarme
N_ARVORES = 300
EPS_MAD = 1e-9
FLAT_THR = 0.08                    # bar (~1.3 contagens do ADC de 12 bits / 250 bar)
STUCK_K = 8                        # ultimas 8 leituras (~40 min)
STUCK_SIGMA = 0.02                 # bar de ruido residual no travamento
SEMENTES_MAIN_PADRAO = 20
SEMENTES_EXTRA_PADRAO = 5
OUT = Path("resultados_anomalias")

TIPOS = ("queda", "deriva", "ruido", "travado", "picos")
METODOS = ("Regra robusta", "Isolation Forest", "Local Outlier Factor", "One-Class SVM")

# Hiperparametros definidos a priori (nao ajustados no teste).
HIPER = {
    "janela_n": N_JANELA,
    "dt_min": DT_MIN,
    "k_lof": K_LOF,
    "nu_ocsvm": NU_OCSVM,
    "gamma": "scale",
    "kernel": "rbf",
    "n_estimators": N_ARVORES,
    "if_max_samples": "auto",
    "contamination_sklearn": "auto (ignorado na decisao)",
    "limiar": "percentil 99 dos escores no conjunto normal de calibracao",
    "lof_novelty": True,
    "python": sys.version.split()[0],
}

FEATURE_NAMES = [
    "inclinacao_ols",
    "inclinacao_theilsen",
    "dp_pressao",
    "dp_difs",
    "med_var_abs",
    "max_var",
    "amplitude",
    "mad_difs",
    "med_seg_dif_abs",
    "prop_planicidade",
    "mudanca_liquida",
]

ABLACOES = {
    "todos": FEATURE_NAMES,
    "sem_planicidade": [f for f in FEATURE_NAMES if f != "prop_planicidade"],
    "sem_extremos": [f for f in FEATURE_NAMES if f not in ("max_var", "amplitude")],
    "tendencia_variabilidade": [
        "inclinacao_ols", "inclinacao_theilsen", "dp_pressao",
        "dp_difs", "med_var_abs", "mudanca_liquida",
    ],
    "apenas_simples": ["dp_pressao", "amplitude", "mudanca_liquida", "med_var_abs"],
}


# ---------------------------------------------------------------- gerador
def _tendencia_normal(rng, n, t):
    """Comportamento normal: queda lenta + modulacao + oscilacao + ruido."""
    p0 = rng.uniform(60.0, 145.0)
    r = rng.uniform(0.5, 5.0)                 # bar/h
    amp = rng.uniform(0.0, 1.5)               # bar
    periodo = rng.uniform(2.0, 8.0)           # h
    fase = rng.uniform(0.0, 2.0 * np.pi)
    sigma = rng.uniform(0.15, 0.80)           # bar
    per_m = rng.uniform(4.0, 12.0)
    fase_m = rng.uniform(0.0, 2.0 * np.pi)
    taxa = r * (1.0 + 0.10 * np.sin(2.0 * np.pi * t / per_m + fase_m))
    p = p0 - np.concatenate([[0.0], np.cumsum(taxa[:-1] * DT_H)])
    p = p + amp * np.sin(2.0 * np.pi * t / periodo + fase)
    p = p + rng.normal(0.0, sigma, size=n)
    return p


def janela_normal(rng, n=N_JANELA):
    t = np.arange(n, dtype=float) * DT_H
    return t, _tendencia_normal(rng, n, t)


def janela_ood(rng, n=N_JANELA):
    """Normal operacional fora da faixa de treino (consumo mais rapido, ruido maior
    ou pressao-base deslocada), ainda fisicamente plausivel no sensor 0-250 bar."""
    t = np.arange(n, dtype=float) * DT_H
    modo = int(rng.integers(0, 3))
    if modo == 0:
        p0 = rng.uniform(40.0, 58.0)
        r = rng.uniform(0.5, 5.0)
        sigma = rng.uniform(0.15, 0.80)
    elif modo == 1:
        p0 = rng.uniform(60.0, 145.0)
        r = rng.uniform(5.5, 8.0)
        sigma = rng.uniform(0.15, 0.80)
    else:
        p0 = rng.uniform(60.0, 145.0)
        r = rng.uniform(0.5, 5.0)
        sigma = rng.uniform(0.85, 1.20)
    amp = rng.uniform(0.0, 1.5)
    periodo = rng.uniform(2.0, 8.0)
    fase = rng.uniform(0.0, 2.0 * np.pi)
    p = p0 - r * t + amp * np.sin(2.0 * np.pi * t / periodo + fase)
    p = p + rng.normal(0.0, sigma, size=n)
    return t, p


def aplicar_anomalia(rng, p, tipo, n, t, severidade="nominal"):
    q = p.copy()
    if tipo == "queda":
        if severidade == "baixa":
            delta = rng.uniform(1.0, 3.0)
        elif severidade == "media":
            delta = rng.uniform(7.0, 15.0)
        elif severidade == "alta":
            delta = rng.uniform(16.0, 25.0)
        else:
            delta = rng.uniform(7.0, 25.0)
        j0 = n // 2
        j = int(rng.integers(j0, n - 3))
        q[j:] -= delta
    elif tipo == "deriva":
        if severidade == "baixa":
            d_fim = rng.uniform(2.0, 5.0)
        elif severidade == "media":
            d_fim = rng.uniform(8.0, 14.0)
        elif severidade == "alta":
            d_fim = rng.uniform(16.0, 24.0)
        else:
            d_fim = rng.uniform(8.0, 20.0)
        q = q - d_fim * (t / t[-1]) ** 2
    elif tipo == "ruido":
        if severidade == "baixa":
            sig = rng.uniform(1.0, 1.8)
        elif severidade == "media":
            sig = rng.uniform(2.5, 4.0)
        elif severidade == "alta":
            sig = rng.uniform(4.5, 6.5)
        else:
            sig = rng.uniform(2.5, 6.0)
        q = q + rng.normal(0.0, sig, size=n)
    elif tipo == "travado":
        if severidade == "baixa":
            k, sig = 4, 0.05
        elif severidade == "media":
            k, sig = 8, STUCK_SIGMA
        elif severidade == "alta":
            k, sig = 12, STUCK_SIGMA
        else:
            k, sig = STUCK_K, STUCK_SIGMA
        q[-k:] = q[-k] + rng.normal(0.0, sig, size=k)
    elif tipo == "picos":
        if severidade == "baixa":
            n_spk, lo, hi = 1, 2.5, 5.0
        elif severidade == "media":
            n_spk, lo, hi = int(rng.integers(1, 3)), 8.0, 16.0
        elif severidade == "alta":
            n_spk, lo, hi = int(rng.integers(2, 4)), 16.0, 25.0
        else:
            n_spk, lo, hi = int(rng.integers(1, 4)), 8.0, 25.0
        idx = rng.choice(np.arange(1, n - 1), size=n_spk, replace=False)
        amp = rng.uniform(lo, hi, size=n_spk)
        sinal = rng.choice(np.array([-1.0, 1.0]), size=n_spk)
        q[idx] += sinal * amp
    else:
        raise ValueError(tipo)
    return q


def conjunto(rng, n_norm, n_por_tipo=0, n_janela=N_JANELA, severidade="nominal", ood=False):
    t = np.arange(n_janela, dtype=float) * DT_H
    xs, ys, tipos = [], [], []
    ger = janela_ood if ood else janela_normal
    for _ in range(n_norm):
        _, p = ger(rng, n_janela)
        xs.append(p)
        ys.append(0)
        tipos.append("normal")
    if n_por_tipo:
        for tipo in TIPOS:
            for _ in range(n_por_tipo):
                _, p = janela_normal(rng, n_janela)
                xs.append(aplicar_anomalia(rng, p, tipo, n_janela, t, severidade))
                ys.append(1)
                tipos.append(tipo)
    return np.asarray(xs), np.asarray(ys, dtype=int), np.asarray(tipos)


# -------------------------------------------------------------- atributos
def theil_sen(t, p):
    """Inclinação Theil-Sen: mediana das inclinacoes par a par i < j."""
    slopes = []
    for i in range(len(t)):
        di = t[i + 1:] - t[i]
        slopes.append((p[i + 1:] - p[i]) / di)
    return float(np.median(np.concatenate(slopes)))


def atributos(p, t):
    difs = np.diff(p)
    seg = np.diff(difs)
    coef = np.polyfit(t, p, 1)[0]
    return {
        "inclinacao_ols": coef / 1.0,                 # bar/h  (t ja em horas)
        "inclinacao_theilsen": theil_sen(t, p),
        "dp_pressao": float(p.std(ddof=1)),
        "dp_difs": float(difs.std(ddof=1)),
        "med_var_abs": float(np.abs(difs).mean()),
        "max_var": float(np.abs(difs).max()),
        "amplitude": float(p.max() - p.min()),
        "mad_difs": float(np.median(np.abs(difs))),
        "med_seg_dif_abs": float(np.abs(seg).mean()),
        "prop_planicidade": float((np.abs(difs) < FLAT_THR).mean()),
        "mudanca_liquida": float(p[-1] - p[0]),
    }


def matriz_atributos(janelas, n_janela=N_JANELA, nomes=FEATURE_NAMES):
    t = np.arange(n_janela, dtype=float) * DT_H
    rows = [atributos(p, t) for p in janelas]
    return np.asarray([[r[k] for k in nomes] for r in rows], dtype=float)


# ---------------------------------------------------------------- detectores
def escore_regra(X, med, mad):
    z = np.abs(X - med) / np.maximum(mad, EPS_MAD)
    return z.max(axis=1)


def ajustar_tudo(Xtr, Xtr_s, seed, k_lof=K_LOF, n_arvores=N_ARVORES):
    """Ajusta os quatro detectores. Escores: MAIOR = mais anomalo."""
    med = np.median(Xtr, axis=0)
    mad = np.median(np.abs(Xtr - med), axis=0)
    ifo = IsolationForest(
        n_estimators=n_arvores, contamination="auto",
        random_state=seed, n_jobs=-1,
    )
    ifo.fit(Xtr)
    lof = LocalOutlierFactor(
        n_neighbors=k_lof, novelty=True, contamination="auto",
        metric="minkowski", p=2,
    )
    lof.fit(Xtr_s)
    oc = OneClassSVM(kernel="rbf", nu=NU_OCSVM, gamma="scale")
    oc.fit(Xtr_s)
    return {"med": med, "mad": mad, "ifo": ifo, "lof": lof, "oc": oc}


def pontuar(modelos, X, Xs):
    return {
        "Regra robusta": escore_regra(X, modelos["med"], modelos["mad"]),
        "Isolation Forest": -modelos["ifo"].score_samples(X),
        "Local Outlier Factor": -modelos["lof"].score_samples(Xs),
        "One-Class SVM": -modelos["oc"].decision_function(Xs),
    }


def limiares(escores_cal):
    return {m: float(np.percentile(s, LIMIAR_PERCENTIL)) for m, s in escores_cal.items()}


def metricas_binarias(y, pred, score):
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    fpr = fp / (fp + tn) if (fp + tn) else 0.0
    return {
        "precisao": float(precision_score(y, pred, zero_division=0)),
        "recall": float(recall_score(y, pred, zero_division=0)),
        "f1": float(f1_score(y, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y, score)),
        "pr_auc": float(average_precision_score(y, score)),
        "fpr": float(fpr),
        "especificidade": float(1.0 - fpr),
        "alarmes_por_1000": float(fpr * 1000.0),
        "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn),
    }


def ppv(recall, fpr, prev):
    num = recall * prev
    den = num + fpr * (1.0 - prev)
    return float(num / den) if den else 0.0


def mcnemar_b(pred_a, pred_b, y):
    ok_a, ok_b = pred_a == y, pred_b == y
    n01 = int((ok_a & ~ok_b).sum())
    n10 = int((~ok_a & ok_b).sum())
    n = n01 + n10
    if n == 0:
        return {"n01": n01, "n10": n10, "p": 1.0}
    from math import erfc, sqrt
    z = abs(n01 - n10) / sqrt(n)
    p = float(erfc(z / sqrt(2.0)))  # bilateral, approx. normal
    return {"n01": n01, "n10": n10, "p": p}


def ic95(v):
    v = np.asarray(v, dtype=float)
    m, s = float(v.mean()), float(v.std(ddof=1)) if len(v) > 1 else 0.0
    h = 1.96 * s / np.sqrt(len(v)) if len(v) > 1 else 0.0
    return {"media": m, "desvio": s, "mediana": float(np.median(v)),
            "ic95_lo": m - h, "ic95_hi": m + h}


# ---------------------------------------------------------------- uma semente
def uma_semente(seed, n_janela=N_JANELA, feats=FEATURE_NAMES,
                n_por_tipo=N_POR_TIPO, severidade="nominal",
                k_lof=K_LOF, n_arvores=N_ARVORES):
    rng = np.random.default_rng(seed)
    Xtr_w, _, _ = conjunto(rng, N_TRAIN, 0, n_janela)
    Xca_w, _, _ = conjunto(rng, N_CAL, 0, n_janela)
    Xte_w, yte, tipos = conjunto(rng, N_TEST_NORM, n_por_tipo, n_janela, severidade)

    Xtr = matriz_atributos(Xtr_w, n_janela, feats)
    Xca = matriz_atributos(Xca_w, n_janela, feats)
    Xte = matriz_atributos(Xte_w, n_janela, feats)

    scaler = StandardScaler().fit(Xtr)
    Xtr_s, Xca_s, Xte_s = scaler.transform(Xtr), scaler.transform(Xca), scaler.transform(Xte)

    modelos = ajustar_tudo(Xtr, Xtr_s, seed, k_lof=k_lof, n_arvores=n_arvores)
    # NUNCA pontuar o LOF no proprio conjunto de ajuste
    esc_cal = pontuar(modelos, Xca, Xca_s)
    thr = limiares(esc_cal)
    esc_te = pontuar(modelos, Xte, Xte_s)

    out = {"global": {}, "por_tipo": {}, "pred": {}, "thr": thr}
    for m in METODOS:
        pred = (esc_te[m] >= thr[m]).astype(int)
        out["global"][m] = metricas_binarias(yte, pred, esc_te[m])
        out["pred"][m] = pred
        recs = {}
        for tipo in TIPOS:
            mask = tipos == tipo
            recs[tipo] = float(pred[mask].mean()) if mask.any() else float("nan")
        out["por_tipo"][m] = recs
    out["y"] = yte
    out["tipos"] = tipos
    out["Xte"] = Xte
    out["Xtr"] = Xtr
    out["feats"] = feats
    out["mcnemar_lof_regra"] = mcnemar_b(
        out["pred"]["Local Outlier Factor"], out["pred"]["Regra robusta"], yte
    )
    d_f1 = out["global"]["Local Outlier Factor"]["f1"] - out["global"]["Regra robusta"]["f1"]
    out["diff_f1_lof_regra"] = float(d_f1)
    return out


# ---------------------------------------------------------------- figuras
def _style():
    plt.rcParams.update({
        "font.family": "Times New Roman",
        "font.size": 11,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "figure.dpi": 140,
        "savefig.dpi": 300,
        "savefig.bbox": "tight",
    })


def fig_exemplos(path):
    rng = np.random.default_rng(0)
    t = np.arange(N_JANELA) * DT_H
    _, p_n = janela_normal(rng)
    painels = [("Normal", p_n)]
    for i_tipo, (tipo, titulo) in enumerate(zip(
            TIPOS, ["Queda abrupta", "Deriva", "Ruído excessivo",
                    "Sensor travado", "Picos"])):
        rng_i = np.random.default_rng(11 + i_tipo)
        _, p = janela_normal(rng_i)
        painels.append((titulo, aplicar_anomalia(rng_i, p, tipo, N_JANELA, t)))
    fig, axes = plt.subplots(2, 3, figsize=(11.2, 6.2), sharex=True)
    for ax, (titulo, p) in zip(axes.ravel(), painels):
        ax.plot(t, p, color="#1f4e79", lw=1.4)
        ax.set_title(titulo)
        ax.set_ylabel("bar")
        ax.set_xlabel("Tempo (h)")
    fig.suptitle("Padrões sintéticos representativos (janela de 24 leituras / ~2 h)", y=1.02)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def fig_barras(resumo, path):
    labs = ["Regra\nrobusta", "Isolation\nForest", "LOF", "One-Class\nSVM"]
    f1 = [resumo[m]["f1"]["media"] for m in METODOS]
    rec = [resumo[m]["recall"]["media"] for m in METODOS]
    f1e = [resumo[m]["f1"]["desvio"] for m in METODOS]
    rece = [resumo[m]["recall"]["desvio"] for m in METODOS]
    x = np.arange(len(labs))
    w = 0.36
    fig, ax = plt.subplots(figsize=(8.4, 4.6))
    ax.bar(x - w / 2, f1, w, yerr=f1e, capsize=3, label="F1-score", color="#2c5aa0")
    ax.bar(x + w / 2, rec, w, yerr=rece, capsize=3, label="Recall", color="#e07b3c")
    ax.set_xticks(x)
    ax.set_xticklabels(labs)
    ax.set_ylim(0, 1.05)
    ax.set_ylabel("Média ± desvio-padrão (20 sementes)")
    ax.set_title("Desempenho global no benchmark sintético de prova de conceito")
    ax.legend(frameon=False)
    fig.savefig(path)
    plt.close(fig)


def fig_mecanismo(por_tipo, path):
    labs = ["Queda", "Deriva", "Ruído", "Travado", "Picos"]
    cores = ["#4c7c5b", "#2c5aa0", "#e07b3c", "#7b4ea3"]
    x = np.arange(len(TIPOS))
    w = 0.2
    fig, ax = plt.subplots(figsize=(9.4, 4.8))
    for i, m in enumerate(METODOS):
        media = [por_tipo[m][t]["media"] for t in TIPOS]
        err = [por_tipo[m][t]["desvio"] for t in TIPOS]
        ax.bar(x + (i - 1.5) * w, media, w, yerr=err, capsize=2,
               label=m.replace("Local Outlier Factor", "LOF"), color=cores[i])
    ax.set_xticks(x)
    ax.set_xticklabels(labs)
    ax.set_ylim(0, 1.08)
    ax.set_ylabel("Recall (média ± dp, 20 sementes)")
    ax.set_title("Sensibilidade por mecanismo de anomalia — quatro detectores")
    ax.legend(frameon=False, ncol=2)
    fig.savefig(path)
    plt.close(fig)


def fig_corr(Xtr, path):
    c = np.corrcoef(Xtr, rowvar=False)
    fig, ax = plt.subplots(figsize=(8.2, 6.8))
    im = ax.imshow(c, cmap="coolwarm", vmin=-1, vmax=1)
    ax.set_xticks(range(len(FEATURE_NAMES)))
    ax.set_yticks(range(len(FEATURE_NAMES)))
    nomes = [n.replace("_", "\n") for n in FEATURE_NAMES]
    ax.set_xticklabels(nomes, fontsize=8, rotation=90)
    ax.set_yticklabels(nomes, fontsize=8)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    ax.set_title("Correlação de Pearson entre atributos (treino, semente 0)")
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def fig_ppv(resumo, path):
    prevs = np.array([0.5, 0.1, 0.05, 0.01, 0.001])
    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    for m, ls in zip(METODOS, ["-", "--", "-.", ":"]):
        rec = resumo[m]["recall"]["media"]
        fpr = resumo[m]["fpr"]["media"]
        vals = [ppv(rec, fpr, p) for p in prevs]
        ax.plot(prevs * 100, vals, marker="o", label=m.replace("Local Outlier Factor", "LOF"), lw=1.8)
    ax.set_xscale("log")
    ax.set_xlabel("Prevalência de anomalias no fluxo operacional (%)")
    ax.set_ylabel("Precisão positiva esperada (PPV)")
    ax.set_title("Impacto da prevalência sobre a precisão (FPR e recall médios do teste)")
    ax.legend(frameon=False)
    ax.set_ylim(0, 1.05)
    fig.savefig(path)
    plt.close(fig)


def fig_severidade(sev, path):
    niveis = ["baixa", "media", "alta"]
    fig, axes = plt.subplots(1, 5, figsize=(13.5, 3.4), sharey=True)
    for ax, tipo in zip(axes, TIPOS):
        for m, mk in zip(METODOS, ["o", "s", "^", "D"]):
            ys = [sev[nv][m][tipo]["media"] for nv in niveis]
            ax.plot(["Baixa", "Média", "Alta"], ys, marker=mk, label=m.replace("Local Outlier Factor", "LOF"))
        ax.set_title(tipo.capitalize())
        ax.set_ylim(-0.05, 1.05)
    axes[0].set_ylabel("Recall")
    axes[0].legend(frameon=False, fontsize=7)
    fig.suptitle("Recall × intensidade da anomalia sintética", y=1.05)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


# ---------------------------------------------------------------- extras
def custo_computacional(seed=0):
    rng = np.random.default_rng(seed)
    Xtr_w, _, _ = conjunto(rng, N_TRAIN, 0)
    Xte_w, _, _ = conjunto(rng, 1000, 0)
    t0 = time.perf_counter()
    Xtr = matriz_atributos(Xtr_w)
    t_feat_tr = time.perf_counter() - t0
    t0 = time.perf_counter()
    Xte = matriz_atributos(Xte_w)
    t_feat_te = (time.perf_counter() - t0) / len(Xte_w) * 1e3
    scaler = StandardScaler().fit(Xtr)
    Xtr_s, Xte_s = scaler.transform(Xtr), scaler.transform(Xte)
    tempos_fit, tempos_inf, tamanhos = {}, {}, {}
    t0 = time.perf_counter()
    modelos = ajustar_tudo(Xtr, Xtr_s, seed)
    tempos_fit["conjunto"] = time.perf_counter() - t0
    t0 = time.perf_counter()
    _ = pontuar(modelos, Xte, Xte_s)
    t_inf = (time.perf_counter() - t0) / len(Xte) * 1e3
    for nome, obj in [("Isolation Forest", modelos["ifo"]),
                      ("Local Outlier Factor", modelos["lof"]),
                      ("One-Class SVM", modelos["oc"])]:
        tamanhos[nome] = len(pickle.dumps(obj)) / 1024.0
    tamanhos["Regra robusta"] = (len(pickle.dumps(modelos["med"])) + len(pickle.dumps(modelos["mad"]))) / 1024.0
    return {
        "tempo_atributos_treino_s": t_feat_tr,
        "tempo_atributos_por_janela_ms": t_feat_te,
        "tempo_inferencia_4_metodos_por_janela_ms": t_inf,
        "tamanho_kb": tamanhos,
        "obs": "Medido em CPU hospedeira; NAO constitui avaliacao TinyML/ESP32.",
    }


def experimento_overlap(seed=0):
    """Serie longa com janela deslizante (passo = 1 leitura)."""
    rng = np.random.default_rng(seed)
    n_serie = 400
    t = np.arange(n_serie) * DT_H
    p0, r, sigma = 120.0, 2.0, 0.4
    p = p0 - r * t + rng.normal(0, sigma, n_serie)
    # um evento de queda persistente a partir da amostra 200
    p[200:] -= 12.0
    # treina em janelas independentes normais
    Xtr_w, _, _ = conjunto(rng, N_TRAIN, 0)
    Xca_w, _, _ = conjunto(rng, N_CAL, 0)
    Xtr = matriz_atributos(Xtr_w)
    Xca = matriz_atributos(Xca_w)
    scaler = StandardScaler().fit(Xtr)
    modelos = ajustar_tudo(Xtr, scaler.transform(Xtr), seed)
    thr = limiares(pontuar(modelos, Xca, scaler.transform(Xca)))

    janelas, y_evt = [], []
    for i in range(N_JANELA - 1, n_serie):
        w = p[i - N_JANELA + 1:i + 1]
        janelas.append(w)
        # evento presente se a janela cobre o instante 200
        y_evt.append(int((i - N_JANELA + 1) <= 200 <= i))
    X = matriz_atributos(np.asarray(janelas))
    Xs = scaler.transform(X)
    escores = pontuar(modelos, X, Xs)
    y_evt = np.asarray(y_evt)
    rel = {}
    for m in METODOS:
        pred = (escores[m] >= thr[m]).astype(int)
        # persistencia: 3 janelas consecutivas
        pers = np.zeros_like(pred)
        run = 0
        for i, v in enumerate(pred):
            run = run + 1 if v else 0
            pers[i] = int(run >= 3)
        # cooldown de 2 janelas apos um alerta persistente
        cool = np.zeros_like(pers)
        cd = 0
        for i, v in enumerate(pers):
            if cd > 0:
                cool[i] = 0
                cd -= 1
            elif v:
                cool[i] = 1
                cd = 2
            else:
                cool[i] = 0
        acordo = float((pred[1:] == pred[:-1]).mean())
        n_alertas_janela = int(pred.sum())
        n_alertas_pers = int(pers.sum())
        n_alertas_cool = int(cool.sum())
        detectou = bool(pred[y_evt == 1].any())
        if detectou:
            first = int(np.argmax(pred & (y_evt == 1)))
            # indice da janela cujo fim e a amostra i0+N-1; atraso em leituras apos o evento
            delay_leituras = max(0, first - (200 - (N_JANELA - 1)))
        else:
            delay_leituras = None
        rel[m] = {
            "acordo_consecutivo": acordo,
            "alertas_por_janela": n_alertas_janela,
            "alertas_com_persistencia_3": n_alertas_pers,
            "alertas_com_persistencia_e_cooldown": n_alertas_cool,
            "evento_detectado": detectou,
            "atraso_leituras": delay_leituras,
            "atraso_min": None if delay_leituras is None else delay_leituras * DT_MIN,
        }
    return rel


# ---------------------------------------------------------------- main
def agregar(lista, chave_global="global"):
    resumo = {m: {} for m in METODOS}
    for metrica in ("precisao", "recall", "f1", "roc_auc", "pr_auc", "fpr",
                    "especificidade", "alarmes_por_1000"):
        for m in METODOS:
            resumo[m][metrica] = ic95([d[chave_global][m][metrica] for d in lista])
    por_tipo = {m: {} for m in METODOS}
    for m in METODOS:
        for t in TIPOS:
            por_tipo[m][t] = ic95([d["por_tipo"][m][t] for d in lista])
    diffs = ic95([d["diff_f1_lof_regra"] for d in lista])
    return resumo, por_tipo, diffs


def imprimir_tabela(resumo, titulo):
    print("\n" + "=" * 78)
    print(titulo)
    print("=" * 78)
    rows = []
    for m in METODOS:
        r = resumo[m]
        rows.append({
            "metodo": m,
            "P": f"{r['precisao']['media']:.4f}±{r['precisao']['desvio']:.4f}",
            "R": f"{r['recall']['media']:.4f}±{r['recall']['desvio']:.4f}",
            "F1": f"{r['f1']['media']:.4f}±{r['f1']['desvio']:.4f}",
            "ROC": f"{r['roc_auc']['media']:.4f}±{r['roc_auc']['desvio']:.4f}",
            "PR": f"{r['pr_auc']['media']:.4f}±{r['pr_auc']['desvio']:.4f}",
            "FPR": f"{r['fpr']['media']:.4f}±{r['fpr']['desvio']:.4f}",
        })
    print(pd.DataFrame(rows).to_string(index=False))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sementes", type=int, default=SEMENTES_MAIN_PADRAO)
    ap.add_argument("--sementes-extra", type=int, default=SEMENTES_EXTRA_PADRAO)
    a = ap.parse_args()
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    OUT.mkdir(exist_ok=True)
    _style()

    print(f"Python {HIPER['python']} | sklearn via import")
    import sklearn
    HIPER["sklearn"] = sklearn.__version__
    HIPER["numpy"] = np.__version__
    HIPER["pandas"] = pd.__version__
    print(f"sklearn {HIPER['sklearn']}  numpy {HIPER['numpy']}")
    print(f"Atributos ({len(FEATURE_NAMES)}): {FEATURE_NAMES}")

    # ---------- A. benchmark principal
    runs = []
    for s in range(a.sementes):
        t0 = time.perf_counter()
        runs.append(uma_semente(s))
        print(f"  [main] semente {s:02d}  F1 LOF={runs[-1]['global']['Local Outlier Factor']['f1']:.4f}"
              f"  regra={runs[-1]['global']['Regra robusta']['f1']:.4f}"
              f"  ({time.perf_counter()-t0:.1f}s)", flush=True)
    resumo, por_tipo, diffs = agregar(runs)
    imprimir_tabela(resumo, f"TABELA 1 — media ± dp em {a.sementes} sementes (teste balanceado)")

    print("\nRecall por mecanismo (media ± dp):")
    for m in METODOS:
        bits = [f"{t}={por_tipo[m][t]['media']:.3f}±{por_tipo[m][t]['desvio']:.3f}" for t in TIPOS]
        print(f"  {m}: " + ", ".join(bits))
    print(f"\nDiferenca F1 (LOF - regra robusta): "
          f"{diffs['media']:.4f}  IC95% [{diffs['ic95_lo']:.4f}, {diffs['ic95_hi']:.4f}]")

    print("\nPPV esperada (usando recall e FPR medios):")
    for prev in (0.5, 0.05, 0.01, 0.001):
        print(f"  prevalencia {prev*100:.2f}%")
        for m in METODOS:
            v = ppv(resumo[m]["recall"]["media"], resumo[m]["fpr"]["media"], prev)
            print(f"    {m}: {v:.4f}")

    # ---------- B. ablacao
    abl = {}
    for nome, feats in ABLACOES.items():
        sub = [uma_semente(s, feats=feats) for s in range(a.sementes_extra)]
        r, _, _ = agregar(sub)
        abl[nome] = {m: {"f1": r[m]["f1"], "recall_travado": ic95(
            [d["por_tipo"][m]["travado"] for d in sub]
        )} for m in METODOS}
        print(f"  [ablacao] {nome}  F1 LOF={r['Local Outlier Factor']['f1']['media']:.4f}  "
              f"regra={r['Regra robusta']['f1']['media']:.4f}", flush=True)

    # ---------- C. sensibilidade LOF k e IF arvores
    sens_k = {}
    for k in (10, 20, 35, 50, 75):
        vals = []
        for s in range(a.sementes_extra):
            d = uma_semente(s, k_lof=k)
            vals.append(d["global"]["Local Outlier Factor"]["f1"])
        sens_k[str(k)] = ic95(vals)
        print(f"  [sens] k={k}  F1 LOF={sens_k[str(k)]['media']:.4f}", flush=True)

    sens_if = {}
    for n_est in (100, 300, 500):
        vals = []
        for s in range(a.sementes_extra):
            d = uma_semente(s, n_arvores=n_est)
            vals.append(d["global"]["Isolation Forest"]["f1"])
        sens_if[str(n_est)] = ic95(vals)
        print(f"  [sens] n_estimators={n_est}  F1 IF={sens_if[str(n_est)]['media']:.4f}", flush=True)

    # ---------- D. severidade
    sev = {}
    for nv in ("baixa", "media", "alta"):
        sub = [uma_semente(s, severidade=nv) for s in range(a.sementes_extra)]
        _, pt, _ = agregar(sub)
        sev[nv] = pt
        print(f"  [severidade] {nv}  recall LOF travado={pt['Local Outlier Factor']['travado']['media']:.3f}",
              flush=True)

    # ---------- E. OOD
    ood_fpr = {m: [] for m in METODOS}
    for s in range(a.sementes_extra):
        rng = np.random.default_rng(1000 + s)
        Xtr_w, _, _ = conjunto(rng, N_TRAIN, 0)
        Xca_w, _, _ = conjunto(rng, N_CAL, 0)
        Xood_w, _, _ = conjunto(rng, 2000, 0, ood=True)
        Xtr, Xca, Xood = (matriz_atributos(w) for w in (Xtr_w, Xca_w, Xood_w))
        scaler = StandardScaler().fit(Xtr)
        modelos = ajustar_tudo(Xtr, scaler.transform(Xtr), s)
        thr = limiares(pontuar(modelos, Xca, scaler.transform(Xca)))
        esc = pontuar(modelos, Xood, scaler.transform(Xood))
        for m in METODOS:
            ood_fpr[m].append(float((esc[m] >= thr[m]).mean()))
    ood_resumo = {m: ic95(ood_fpr[m]) for m in METODOS}
    print("  [ood] FPR:", {m: f"{ood_resumo[m]['media']:.4f}" for m in METODOS})

    # ---------- F. tamanho de janela
    jan = {}
    for n in (12, 24, 48):
        sub = [uma_semente(s, n_janela=n) for s in range(a.sementes_extra)]
        r, _, _ = agregar(sub)
        jan[str(n)] = {m: r[m]["f1"] for m in METODOS}
        print(f"  [janela] n={n}  F1 LOF={r['Local Outlier Factor']['f1']['media']:.4f}", flush=True)

    # ---------- G. overlap e custo
    overlap = experimento_overlap(0)
    custo = custo_computacional(0)
    print("  [overlap]", {m: overlap[m]["acordo_consecutivo"] for m in METODOS})
    print("  [custo] inferencia 4 metodos ms/janela",
          round(custo["tempo_inferencia_4_metodos_por_janela_ms"], 3))

    # ---------- figuras
    fig_exemplos(OUT / "figura2_padroes.png")
    fig_barras(resumo, OUT / "figura3_desempenho.png")
    fig_mecanismo(por_tipo, OUT / "figura4_mecanismos.png")
    fig_corr(runs[0]["Xtr"], OUT / "figura5_correlacao.png")
    fig_ppv(resumo, OUT / "figura6_ppv.png")
    fig_severidade(sev, OUT / "figura7_severidade.png")

    payload = {
        "hiperparametros": HIPER,
        "atributos": FEATURE_NAMES,
        "n_sementes": a.sementes,
        "resumo": resumo,
        "por_tipo": por_tipo,
        "diff_f1_lof_regra": diffs,
        "ablacao": abl,
        "sensibilidade_k": sens_k,
        "sensibilidade_if": sens_if,
        "severidade": {nv: {m: {t: sev[nv][m][t] for t in TIPOS} for m in METODOS}
                       for nv in sev},
        "ood_fpr": ood_resumo,
        "janela": jan,
        "overlap": overlap,
        "custo": custo,
        "ppv": {str(p): {m: ppv(resumo[m]["recall"]["media"], resumo[m]["fpr"]["media"], p)
                         for m in METODOS}
                for p in (0.5, 0.05, 0.01, 0.001)},
        "mcnemar_semente0": runs[0]["mcnemar_lof_regra"],
        "confusao_semente0": {m: {k: runs[0]["global"][m][k] for k in ("tp", "fp", "tn", "fn")}
                              for m in METODOS},
    }
    with (OUT / "metricas.json").open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, default=float)

    pd.DataFrame({
        m: {k: resumo[m][k]["media"] for k in resumo[m]}
        for m in METODOS
    }).T.to_csv(OUT / "tabela1_medias.csv")
    print(f"\nResultados em {OUT.resolve()}")


if __name__ == "__main__":
    main()
