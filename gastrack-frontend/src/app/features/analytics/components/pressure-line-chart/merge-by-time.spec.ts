import { mergeByTime } from './pressure-line-chart.component';

/**
 * A cunha no gráfico aparecia ao sair da aba e voltar. Aba em segundo plano
 * congela o requestAnimationFrame e o refresh: as leituras se acumulam no buffer
 * e chegam em lote quando a aba volta. Anexadas com push puro entravam fora de
 * ordem, o traço voltava no tempo e o preenchimento até a origem virava um
 * triângulo do canto inferior esquerdo até o último ponto.
 */
describe('mergeByTime', () => {
  it('should_KeepChronologicalOrder_When_BatchArrivesOutOfOrder', () => {
    const existentes = [
      { x: 1_000, y: 140 },
      { x: 2_000, y: 138 },
    ];
    // Lote acumulado enquanto a aba estava escondida, fora de ordem entre si
    // e com um ponto anterior ao último já plotado.
    const lote = [
      { x: 4_000, y: 134 },
      { x: 1_500, y: 139 },
      { x: 3_000, y: 136 },
    ];

    const resultado = mergeByTime(existentes, lote);

    expect(resultado.map((p) => p.x)).toEqual([1_000, 1_500, 2_000, 3_000, 4_000]);
  });

  it('should_NotDuplicate_When_SameTimestampArrivesTwice', () => {
    // O buffer pode redrenar uma leitura já plotada depois de um reseed.
    const existentes = [{ x: 1_000, y: 140 }];

    const resultado = mergeByTime(existentes, [{ x: 1_000, y: 140 }]);

    expect(resultado).toEqual([{ x: 1_000, y: 140 }]);
  });

  it('should_ReturnSameArray_When_NothingToMerge', () => {
    const existentes = [{ x: 1_000, y: 140 }];

    expect(mergeByTime(existentes, [])).toBe(existentes);
  });
});
