import { kwhDeReporte, ordenarPorUso } from './uso';

describe('ordenarPorUso', () => {
  it('pone primero el aparato más reportado', () => {
    const lista = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const regs = [{ aparato_id: 3 }, { aparato_id: 3 }, { aparato_id: 2 }];
    expect(ordenarPorUso(lista, regs).map((a) => a.id)).toEqual([3, 2, 1]);
  });
});

describe('kwhDeReporte', () => {
  it('multiplica potencia, cantidad y horas', () => {
    expect(kwhDeReporte({ potencia_w: 100, cantidad: 2 }, 6)).toBeCloseTo(1.2);
  });
});
