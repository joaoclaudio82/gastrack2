import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EQUIPMENT_CONDITION, type Equipment } from '@models/equipment.model';
import { KitSwapModalComponent, type KitSwapResult } from './kit-swap-modal.component';

function mkEquip(
  partial: Partial<Equipment> & { id: number; equipmentTypeName: string },
): Equipment {
  return {
    equipmentKitId: null,
    kitCode: null,
    companyId: null,
    companyName: null,
    equipmentTypeId: 1,
    assetTag: `AT-${String(partial.id)}`,
    description: null,
    serialNumber: null,
    manufacturer: null,
    model: null,
    purchaseDate: null,
    warrantyExpirationDate: null,
    condition: EQUIPMENT_CONDITION.NEW,
    notes: null,
    active: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    createdById: 1,
    createdByName: 'x',
    ...partial,
  };
}

describe('KitSwapModalComponent', () => {
  function build() {
    TestBed.configureTestingModule({
      imports: [KitSwapModalComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(KitSwapModalComponent);
    fixture.componentRef.setInput('isOpen', true);
    return { fixture, component: fixture.componentInstance };
  }

  it('should_list_only_esp32_candidates_for_esp_mode', () => {
    const { fixture, component } = build();
    fixture.componentRef.setInput('mode', 'esp');
    fixture.componentRef.setInput('candidates', [
      mkEquip({ id: 1, equipmentTypeName: 'ESP32', serialNumber: 'NEW999' }),
      mkEquip({ id: 2, equipmentTypeName: 'Sensor' }),
    ]);
    fixture.detectChanges();

    expect(component.newEspOptions().map((o) => o.value)).toEqual([1]);
  });

  it('should_list_only_active_non_esp_current_equipment_as_old_sensors', () => {
    const { fixture, component } = build();
    fixture.componentRef.setInput('mode', 'sensor');
    fixture.componentRef.setInput('currentEquipments', [
      mkEquip({ id: 10, equipmentTypeName: 'ESP32' }),
      mkEquip({ id: 11, equipmentTypeName: 'Sensor' }),
      mkEquip({ id: 12, equipmentTypeName: 'Sensor', active: false }),
    ]);
    fixture.detectChanges();

    expect(component.oldSensorOptions().map((o) => o.value)).toEqual([11]);
  });

  it('should_gate_submit_until_esp_selected_and_emit_esp_result', () => {
    const { fixture, component } = build();
    fixture.componentRef.setInput('mode', 'esp');
    // Precisa de um ESP atual (gateway a sair) para permitir a troca.
    fixture.componentRef.setInput('currentEquipments', [
      mkEquip({ id: 99, equipmentTypeName: 'ESP32', serialNumber: 'OLD' }),
    ]);
    fixture.detectChanges();
    expect(component.canSubmit()).toBe(false);

    component.selectedNewEsp.set(7);
    expect(component.canSubmit()).toBe(true);

    let emitted: KitSwapResult | undefined;
    component.submitted.subscribe((r) => (emitted = r));
    component.onSubmit();

    expect(emitted).toEqual({ mode: 'esp', newEspEquipmentId: 7, retireOld: false });
  });

  it('should_require_both_sensors_and_emit_sensor_result', () => {
    const { fixture, component } = build();
    fixture.componentRef.setInput('mode', 'sensor');
    fixture.detectChanges();

    component.selectedOldSensor.set(11);
    expect(component.canSubmit()).toBe(false); // still missing the replacement
    component.selectedNewSensor.set(21);
    expect(component.canSubmit()).toBe(true);

    let emitted: KitSwapResult | undefined;
    component.submitted.subscribe((r) => (emitted = r));
    component.onSubmit();

    expect(emitted).toEqual({
      mode: 'sensor',
      oldSensorEquipmentId: 11,
      newSensorEquipmentId: 21,
      retireOld: false,
    });
  });

  it('should_emit_retireOld_true_when_retire_selected', () => {
    const { fixture, component } = build();
    fixture.componentRef.setInput('mode', 'esp');
    fixture.detectChanges();

    component.selectedNewEsp.set(7);
    component.retireOld.set(true);

    let emitted: KitSwapResult | undefined;
    component.submitted.subscribe((r) => (emitted = r));
    component.onSubmit();

    expect(emitted).toEqual({ mode: 'esp', newEspEquipmentId: 7, retireOld: true });
  });
});
