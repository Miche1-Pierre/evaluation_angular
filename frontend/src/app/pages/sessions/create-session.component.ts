import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { SessionsService } from '../../core/services/sessions.service';
import { Product, SessionDifficulty, SessionVisibility } from '../../core/models';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ZardInputDirective } from '../../shared/components/input/input.directive';
import { ZardFormLabelComponent } from '../../shared/components/form/form.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardInputDirective,
    ZardFormLabelComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './create-session.component.html',
  styleUrls: ['./create-session.component.css'],
})
export class CreateSessionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly sessionsService = inject(SessionsService);

  sessionForm!: FormGroup;
  products = signal<Product[]>([]);
  selectedProducts = signal<number[]>([]);
  loading = signal(false);
  loadingProducts = signal(true);
  error = signal<string | null>(null);

  readonly difficulties: { value: SessionDifficulty; label: string }[] = [
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
    { value: 'hard', label: 'Difficile' },
  ];

  readonly visibilities: { value: SessionVisibility; label: string; description: string }[] = [
    { value: 'public', label: 'Publique', description: 'Visible et accessible par tous' },
    { value: 'private', label: 'Privée', description: 'Accessible uniquement sur invitation' },
    { value: 'friends_only', label: 'Amis uniquement', description: 'Visible et accessible par vos amis' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
  }

  private initForm(): void {
    this.sessionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      difficulty: ['medium', Validators.required],
      visibility: ['public', Validators.required],
      max_participants: [null, [Validators.min(2), Validators.max(100)]],
    });
  }

  private loadProducts(): void {
    this.loadingProducts.set(true);
    this.productsService.getAllProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loadingProducts.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des produits:', err);
        this.error.set('Impossible de charger les produits. Veuillez réessayer.');
        this.loadingProducts.set(false);
      },
    });
  }

  toggleProductSelection(productId: number): void {
    const selected = this.selectedProducts();
    const index = selected.indexOf(productId);

    if (index > -1) {
      // Retirer le produit
      this.selectedProducts.set(selected.filter((id) => id !== productId));
    } else if (selected.length < 4) {
      // Ajouter le produit (max 4)
      this.selectedProducts.set([...selected, productId]);
    }
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProducts().includes(productId);
  }

  canSelectMore(): boolean {
    return this.selectedProducts().length < 4;
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      this.error.set('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    if (this.selectedProducts().length !== 4) {
      this.error.set('Vous devez sélectionner exactement 4 produits.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.sessionForm.value;
    const sessionData = {
      name: formValue.name,
      difficulty: formValue.difficulty as SessionDifficulty,
      visibility: formValue.visibility as SessionVisibility,
      max_participants: formValue.max_participants || undefined,
      product_ids: this.selectedProducts(),
    };

    this.sessionsService.createSession(sessionData).subscribe({
      next: (session) => {
        console.log('Session créée avec succès:', session);
        this.router.navigate(['/sessions', session.id]);
      },
      error: (err) => {
        console.error('Erreur lors de la création de la session:', err);
        this.error.set(
          err.error?.message || 'Une erreur est survenue lors de la création de la session.'
        );
        this.loading.set(false);
      },
    });
  }

  // Getters pour la validation
  get name() {
    return this.sessionForm.get('name');
  }
  get difficulty() {
    return this.sessionForm.get('difficulty');
  }
  get visibility() {
    return this.sessionForm.get('visibility');
  }
  get maxParticipants() {
    return this.sessionForm.get('max_participants');
  }
}
