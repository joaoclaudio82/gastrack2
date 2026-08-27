import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '@core/constants/pagination.constants';
import { AddressService } from '@core/services/address.service';
import { CompanyService } from '@core/services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import type { AddressRequest } from '@models/address.model';
import type { Company } from '@models/company.model';
import {
  ActionMenuComponent,
  type ActionMenuItem,
} from '@shared/components/ui/action-menu/action-menu.component';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { DataTableFooterComponent } from '@shared/components/ui/data-table/data-table-footer.component';
import { DataTableComponent } from '@shared/components/ui/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { forkJoin, of } from 'rxjs';
import { concatMap, finalize } from 'rxjs/operators';
import type { CompanyFormSubmitPayload } from '../../components/company-form/company-form.component';
import { CompanyFormComponent } from '../../components/company-form/company-form.component';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    DatePipe,
    ActionMenuComponent,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    DataTableComponent,
    DataTableFooterComponent,
    EmptyStateComponent,
    CompanyFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './companies.component.html',
})
export class CompaniesComponent implements OnInit {
  readonly companyService = inject(CompanyService);
  readonly addressService = inject(AddressService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly isFormOpen = signal(false);
  readonly selectedCompany = signal<Company | null>(null);
  readonly isSaving = signal(false);
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  constructor() {
    effect(() => {
      const pagination = this.companyService.pagination();
      const resolvedPage = pagination.page > 0 ? pagination.page : 1;
      if (resolvedPage !== this.currentPage()) {
        this.currentPage.set(resolvedPage);
      }

      const resolvedSize = pagination.pageSize > 0 ? pagination.pageSize : this.pageSize();
      if (resolvedSize !== this.pageSize()) {
        this.pageSize.set(resolvedSize);
      }
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(page = this.currentPage(), pageSize = this.pageSize()): void {
    this.companyService.getAll({
      page,
      pageSize,
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadCompanies(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadCompanies(1, pageSize);
  }

  openForm(): void {
    this.selectedCompany.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.selectedCompany.set(null);
  }

  rowActions(company: Company): ActionMenuItem[] {
    return [
      {
        label: 'Novo Endereço',
        icon: 'add',
        action: () => {
          this.addAddressForCompany(company);
        },
      },
      {
        label: 'Editar',
        icon: 'edit',
        action: () => {
          this.editCompany(company);
        },
      },
      company.active
        ? {
            label: 'Desativar',
            icon: 'toggle',
            action: () => {
              this.deactivateCompany(company);
            },
          }
        : {
            label: 'Ativar',
            icon: 'toggle',
            action: () => {
              this.activateCompany(company);
            },
          },
    ];
  }

  editCompany(company: Company): void {
    this.selectedCompany.set(company);
    this.isFormOpen.set(true);
  }

  addAddressForCompany(company: Company): void {
    void this.router.navigate(['/admin/addresses'], {
      queryParams: {
        companyId: company.id,
        companyName: company.name,
        openForm: 'true',
      },
    });
  }

  onFormSubmit(payload: CompanyFormSubmitPayload): void {
    const selected = this.selectedCompany();
    const { company, addresses, removedAddressIds } = payload;

    const validAddresses = addresses.filter((a): a is { id?: number } & AddressRequest =>
      Boolean(a.name?.trim() && a.street?.trim() && a.zipCode?.trim() && a.cityId != null),
    );

    this.isSaving.set(true);

    if (selected) {
      this.companyService
        .update(selected.id, company)
        .pipe(
          concatMap((updatedCompany) => {
            const companyId = Number(updatedCompany.id);
            const deleteRemoved =
              removedAddressIds.length > 0
                ? forkJoin(removedAddressIds.map((id) => this.addressService.delete(id))).pipe(
                    concatMap(() => of(updatedCompany)),
                  )
                : of(updatedCompany);

            if (validAddresses.length === 0) {
              return deleteRemoved;
            }
            const addressOps = validAddresses.map((addr) => {
              const req: AddressRequest = {
                companyId,
                name: addr.name,
                street: addr.street,
                number: addr.number,
                complement: addr.complement,
                neighborhood: addr.neighborhood,
                cityId: addr.cityId,
                zipCode: addr.zipCode,
              };
              return addr.id
                ? this.addressService.update(addr.id, req)
                : this.addressService.create(req);
            });
            return deleteRemoved.pipe(
              concatMap(() => forkJoin(addressOps).pipe(concatMap(() => of(updatedCompany)))),
            );
          }),
        )
        .pipe(
          finalize(() => {
            this.isSaving.set(false);
          }),
        )
        .subscribe({
          next: () => {
            this.notificationService.success('Empresa atualizada com sucesso!');
            this.closeForm();
            this.loadCompanies();
          },
          error: () => {
            this.notificationService.error('Erro ao atualizar empresa.');
          },
        });
    } else {
      this.companyService
        .create(company)
        .pipe(
          concatMap((createdCompany) => {
            const companyId = Number(createdCompany.id);
            if (validAddresses.length === 0) {
              return of(createdCompany);
            }
            const addressOps = validAddresses.map((addr) => {
              const req: AddressRequest = {
                companyId,
                name: addr.name,
                street: addr.street,
                number: addr.number,
                complement: addr.complement,
                neighborhood: addr.neighborhood,
                cityId: addr.cityId,
                zipCode: addr.zipCode,
              };
              return this.addressService.create(req);
            });
            return forkJoin(addressOps).pipe(concatMap(() => of(createdCompany)));
          }),
        )
        .pipe(
          finalize(() => {
            this.isSaving.set(false);
          }),
        )
        .subscribe({
          next: () => {
            this.notificationService.success('Empresa criada com sucesso!');
            this.closeForm();
            this.loadCompanies();
          },
          error: () => {
            this.notificationService.error('Erro ao criar empresa.');
          },
        });
    }
  }

  activateCompany(company: Company): void {
    this.companyService.activate(company.id).subscribe({
      next: () => {
        this.notificationService.success('Empresa ativada com sucesso!');
      },
      error: () => {
        this.notificationService.error('Erro ao ativar empresa.');
      },
    });
  }

  deactivateCompany(company: Company): void {
    this.companyService.deactivate(company.id).subscribe({
      next: () => {
        this.notificationService.success('Empresa desativada com sucesso!');
      },
      error: () => {
        this.notificationService.error('Erro ao desativar empresa.');
      },
    });
  }
}
