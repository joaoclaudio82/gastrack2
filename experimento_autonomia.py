"""
Experimento computacional controlado — predicao de autonomia a partir de series
temporais de pressao.

Complementa o artigo com as quatro analises que faltavam:
  (a) metricas restritas ao SUBCONJUNTO COMUM a todos os metodos;
  (b) PREDITOR DE REFERENCIA TRIVIAL (media da autonomia no treino);
  (c) repeticao com N SEMENTES, reportando media +/- desvio-padrao;
  (d) DISTRIBUICAO DO ALVO (mediana e intervalo interquartilico da autonomia real).

O gerador de ciclos segue os parametros descritos na Secao 3.2 do artigo.
Confira-os contra o seu gerador original antes de substituir os numeros do texto:
se houver divergencia, os valores da Tabela 1 tambem precisam ser regerados por
este mesmo script, para que todo o artigo reporte uma unica execucao coerente.

Uso:
    python experimento_autonomia.py                 # 10 sementes (padrao)
    python experimento_autonomia.py --sementes 30
"""

import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# ----------------------------------------------------------------- parametros
P0 = 150.0            # pressao nominal inicial (bar)
P_CRIT = 30.0         # limiar critico (bar) = 20% da referencia
DT_MIN = 5            # intervalo de amostragem (minutos)
DT_H = DT_MIN / 60.0
JANELA_H = 1.0        # janela de analise (horas)
JANELA_N = int(JANELA_H / DT_H)          # 12 leituras
PASSO_PREV_H = 0.5    # previsoes a cada 30 minutos
HIST_MIN_H = 1.0      # historico minimo antes da primeira previsao
HORIZ_MIN_H = 1.0     # so preve se faltar >= 1 h para o cruzamento
N_CICLOS = 320
MAX_H = 240.0         # janela maxima de simulacao
TETO_H = 168.0        # teto aplicado as previsoes para calculo das metricas
TAXA_MIN_VALIDA = 0.05  # bar/h — abaixo disso o metodo se abstem
REGIMES = ("estacionario", "diurno", "por_trechos", "intermitente")


# ------------------------------------------------------------------- gerador
def gerar_ciclo(rng):
    """Devolve (t_h, p_obs, autonomia_real) ou None se nao cruzar o limiar."""
    regime = REGIMES[rng.integers(len(REGIMES))]
    taxa_base = rng.uniform(1.2, 6.0)          # bar/h
    amp_osc = rng.uniform(0.0, 1.8)            # bar
    per_osc = rng.uniform(2.0, 12.0)           # h
    sigma = rng.uniform(0.15, 0.80)            # bar
    fase = rng.uniform(0, 2 * np.pi)
    hora_ini = rng.uniform(0, 24)

    n_max = int(MAX_H / DT_H)
    t = np.arange(n_max) * DT_H
    hora_dia = (hora_ini + t) % 24

    if regime == "estacionario":
        taxa = np.full(n_max, taxa_base)
    elif regime == "diurno":
        taxa = taxa_base * (1.0 + 0.6 * np.sin(2 * np.pi * hora_dia / 24 + fase))
    elif regime == "por_trechos":
        taxa = np.empty(n_max)
        i = 0
        while i < n_max:
            dur = int(rng.uniform(2.0, 8.0) / DT_H)
            taxa[i:i + dur] = taxa_base * rng.uniform(0.4, 1.8)
            i += dur
    else:  # intermitente
        taxa = np.empty(n_max)
        i, ativo = 0, rng.random() < 0.5
        while i < n_max:
            dur = int(rng.uniform(1.0, 5.0) / DT_H)
            taxa[i:i + dur] = taxa_base * (rng.uniform(1.2, 2.2) if ativo
                                           else rng.uniform(0.0, 0.15))
            ativo = not ativo
            i += dur
    taxa = np.clip(taxa, 0.0, None)

    p_real = P0 - np.cumsum(taxa) * DT_H
    cruz = np.argmax(p_real <= P_CRIT)
    if p_real[cruz] > P_CRIT:
        return None                                   # nao cruzou: descartar
    t_cruz = t[cruz]

    t = t[:cruz + 1]
    p_real = p_real[:cruz + 1]
    hora_dia = hora_dia[:cruz + 1]
    p_obs = (p_real
             + amp_osc * np.sin(2 * np.pi * t / per_osc + fase)
             + rng.normal(0.0, sigma, size=t.size))
    return dict(t=t, p=p_obs, hora=hora_dia, t_cruz=t_cruz, regime=regime)


# ------------------------------------------------------------------ atributos
def atributos(t_win, p_win, hora_atual):
    """Extrai os atributos da janela; taxas em bar/h (positivas = queda)."""
    inc_inst = -(p_win[-1] - p_win[-2]) / DT_H
    queda_liq = -(p_win[-1] - p_win[0]) / (DT_H * (len(p_win) - 1))
    coef = np.polyfit(t_win, p_win, 1)[0]
    inc_reg = -coef
    # mediana das inclinacoes par a par (estimador robusto tipo Theil-Sen)
    di = np.subtract.outer(p_win, p_win)
    dt = np.subtract.outer(t_win, t_win)
    m = ~np.eye(len(p_win), dtype=bool)
    inc_rob = -np.median(di[m] / dt[m])
    k15 = max(2, int(0.25 / DT_H) + 1)
    inc_15 = -(p_win[-1] - p_win[-k15]) / (DT_H * (k15 - 1))
    difs = np.diff(p_win)
    return dict(
        pressao=p_win[-1],
        inc_inst=inc_inst, queda_liq=queda_liq, inc_reg=inc_reg,
        inc_rob=inc_rob, inc_15=inc_15,
        dp_pressao=p_win.std(), dp_difs=difs.std(),
        med_var_abs=np.abs(difs).mean(),
        hora_sin=np.sin(2 * np.pi * hora_atual / 24),
        hora_cos=np.cos(2 * np.pi * hora_atual / 24),
    )


def por_inclinacao(pressao, taxa):
    """Autonomia por extrapolacao; NaN quando o metodo se abstem."""
    if taxa <= TAXA_MIN_VALIDA:
        return np.nan
    return (pressao - P_CRIT) / taxa


# -------------------------------------------------------------------- metricas
def metricas(y, yhat):
    ok = ~np.isnan(yhat)
    cobertura = 100.0 * ok.mean()
    if ok.sum() == 0:
        return dict(MAE=np.nan, RMSE=np.nan, MAPE=np.nan, Cobertura=cobertura)
    yv, pv = y[ok], np.clip(yhat[ok], 0.0, TETO_H)
    err = pv - yv
    return dict(MAE=np.abs(err).mean(),
                RMSE=float(np.sqrt((err ** 2).mean())),
                MAPE=100.0 * np.abs(err / yv).mean(),
                Cobertura=cobertura)


METODOS = ["Inclinacao instantanea", "Queda liquida (1 h)", "Regressao linear (1 h)",
           "Regressao robusta mediana", "Random Forest", "Referencia trivial (media)"]
FEATS = ["pressao", "inc_inst", "queda_liq", "inc_reg", "inc_rob", "inc_15",
         "dp_pressao", "dp_difs", "med_var_abs", "hora_sin", "hora_cos"]


def uma_execucao(semente, verbose=False):
    rng = np.random.default_rng(semente)
    ciclos, descartados = [], 0
    while len(ciclos) < N_CICLOS - descartados and len(ciclos) + descartados < N_CICLOS:
        c = gerar_ciclo(rng)
        if c is None:
            descartados += 1
        else:
            ciclos.append(c)

    linhas = []
    for idc, c in enumerate(ciclos):
        passo = int(PASSO_PREV_H / DT_H)
        i0 = int(HIST_MIN_H / DT_H)
        for i in range(i0, len(c["t"]), passo):
            restante = c["t_cruz"] - c["t"][i]
            if restante < HORIZ_MIN_H:
                continue
            w = slice(i - JANELA_N + 1, i + 1)
            if w.start < 0:
                continue
            f = atributos(c["t"][w], c["p"][w], c["hora"][i])
            f.update(ciclo=idc, regime=c["regime"], y=restante)
            linhas.append(f)
    df = pd.DataFrame(linhas)

    ids = np.array(sorted(df.ciclo.unique()))
    rng.shuffle(ids)
    corte = int(0.7 * len(ids))
    tr = df[df.ciclo.isin(ids[:corte])]
    te = df[df.ciclo.isin(ids[corte:])]

    rf = RandomForestRegressor(n_estimators=300, min_samples_leaf=5,
                               max_features="sqrt", random_state=semente, n_jobs=-1)
    rf.fit(tr[FEATS], tr.y)

    y = te.y.to_numpy()
    preds = {
        "Inclinacao instantanea": np.array([por_inclinacao(p, s) for p, s in zip(te.pressao, te.inc_inst)]),
        "Queda liquida (1 h)": np.array([por_inclinacao(p, s) for p, s in zip(te.pressao, te.queda_liq)]),
        "Regressao linear (1 h)": np.array([por_inclinacao(p, s) for p, s in zip(te.pressao, te.inc_reg)]),
        "Regressao robusta mediana": np.array([por_inclinacao(p, s) for p, s in zip(te.pressao, te.inc_rob)]),
        "Random Forest": rf.predict(te[FEATS]),
        "Referencia trivial (media)": np.full(len(te), tr.y.mean()),
    }

    global_ = {m: metricas(y, p) for m, p in preds.items()}
    comum = ~np.isnan(np.vstack([preds[m] for m in METODOS])).any(axis=0)
    subconj = {m: metricas(y[comum], preds[m][comum]) for m in METODOS}
    regime = {m: {r: metricas(y[te.regime.to_numpy() == r], preds[m][te.regime.to_numpy() == r])["MAE"]
                  for r in REGIMES} for m in METODOS}
    alvo = dict(n_ciclos=len(ciclos), n_descartados=descartados, n_instantes=len(df),
                mediana=float(np.median(y)), q1=float(np.percentile(y, 25)),
                q3=float(np.percentile(y, 75)), frac_comum=100.0 * comum.mean())
    return global_, subconj, regime, alvo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sementes", type=int, default=10)
    a = ap.parse_args()

    globs, subs, regs, alvos = [], [], [], []
    for s in range(a.sementes):
        g, sc, rg, al = uma_execucao(s)
        globs.append(g); subs.append(sc); regs.append(rg); alvos.append(al)
        print(f"  semente {s:>2} concluida", flush=True)

    def resumo(lista, chave):
        v = {m: np.array([d[m][chave] for d in lista]) for m in METODOS}
        return pd.DataFrame({"media": {m: v[m].mean() for m in METODOS},
                             "desvio": {m: v[m].std(ddof=1) for m in METODOS}})

    print("\n" + "=" * 72)
    print("TABELA 1 — desempenho global (media +/- dp sobre %d sementes)" % a.sementes)
    print("=" * 72)
    t1 = pd.DataFrame({k: resumo(globs, k).media for k in ("MAE", "RMSE", "MAPE", "Cobertura")})
    t1["MAE_dp"] = resumo(globs, "MAE").desvio
    t1["RMSE_dp"] = resumo(globs, "RMSE").desvio
    print(t1.round(2).to_string())

    print("\n" + "=" * 72)
    print("SUBCONJUNTO COMUM a todos os metodos (%.1f%% dos instantes)"
          % np.mean([x["frac_comum"] for x in alvos]))
    print("=" * 72)
    t2 = pd.DataFrame({k: resumo(subs, k).media for k in ("MAE", "RMSE", "MAPE")})
    t2["MAE_dp"] = resumo(subs, "MAE").desvio
    print(t2.round(2).to_string())

    print("\n" + "=" * 72)
    print("TABELA 2 — MAE por regime de consumo (media sobre as sementes)")
    print("=" * 72)
    t3 = pd.DataFrame({r: {m: np.mean([d[m][r] for d in regs]) for m in METODOS} for r in REGIMES})
    print(t3.round(2).to_string())

    print("\n" + "=" * 72)
    print("DISTRIBUICAO DO ALVO E DIMENSOES DO EXPERIMENTO")
    print("=" * 72)
    A = pd.DataFrame(alvos)
    print(f"ciclos validos ............ {A.n_ciclos.mean():.0f} (descartados: {A.n_descartados.mean():.1f})")
    print(f"instantes de previsao ..... {A.n_instantes.mean():.0f}")
    print(f"autonomia real (mediana) .. {A.mediana.mean():.2f} h")
    print(f"intervalo interquartilico . {A.q1.mean():.2f} h a {A.q3.mean():.2f} h")
    print("\nSubstitua os marcadores «___» do artigo pelos valores acima.")


if __name__ == "__main__":
    main()
