import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameService, SessionProduct, AnswerResponse } from '../../core/services/game.service';
import { SessionsService } from '../../core/services/sessions.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ZardInputDirective } from '../../shared/components/input/input.directive';
import { ZardFormLabelComponent } from '../../shared/components/form/form.component';
import { ZardBadgeComponent } from '../../shared/components/badge/badge.component';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

interface ProductAnswer {
  product: SessionProduct;
  guessedPrice: number | null;
  submitted: boolean;
  result: AnswerResponse | null;
}

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardInputDirective,
    ZardFormLabelComponent,
    ZardBadgeComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './game-play.component.html',
  styleUrls: ['./game-play.component.css'],
})
export class GamePlayComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly gameService = inject(GameService);
  private readonly sessionsService = inject(SessionsService);

  // Expose Math for template
  readonly Math = Math;

  sessionId = signal<number | null>(null);
  sessionName = signal<string>('Session');
  products = signal<ProductAnswer[]>([]);
  loading = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);
  sessionScore = signal(0);
  gameCompleted = signal(false);

  // Computed signals
  answeredCount = computed(() => this.products().filter((p) => p.submitted).length);
  totalProducts = computed(() => this.products().length);
  progressPercent = computed(() => {
    const total = this.totalProducts();
    return total > 0 ? (this.answeredCount() / total) * 100 : 0;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de session invalide');
      this.loading.set(false);
      return;
    }

    this.sessionId.set(Number(id));
    this.loadSession();
    this.loadProducts();
  }

  private loadSession(): void {
    const id = this.sessionId();
    if (!id) return;

    this.sessionsService.getSessionById(id).subscribe({
      next: (session) => {
        this.sessionName.set(session.name);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la session:', err);
      },
    });
  }

  private loadProducts(): void {
    const id = this.sessionId();
    if (!id) return;

    this.loading.set(true);
    this.gameService.getSessionProducts(id).subscribe({
      next: (products) => {
        // Initialiser les produits avec leurs états
        const productAnswers: ProductAnswer[] = products.map((product) => ({
          product,
          guessedPrice: null,
          submitted: false,
          result: null,
        }));
        this.products.set(productAnswers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des produits:', err);
        this.error.set(
          err.error?.message || 'Impossible de charger les produits. Êtes-vous participant de cette session ?'
        );
        this.loading.set(false);
      },
    });
  }

  submitGuess(productAnswer: ProductAnswer): void {
    const id = this.sessionId();
    if (!id || productAnswer.guessedPrice === null || productAnswer.guessedPrice <= 0) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.gameService
      .submitAnswer(id, {
        product_id: productAnswer.product.id,
        guessed_price: productAnswer.guessedPrice,
      })
      .subscribe({
        next: (response) => {
          // Mettre à jour le produit avec le résultat
          const updatedProducts = this.products().map((p) =>
            p.product.id === productAnswer.product.id
              ? { ...p, submitted: true, result: response }
              : p
          );
          this.products.set(updatedProducts);
          this.sessionScore.set(response.session_score);
          this.gameCompleted.set(response.completed);

          // Si le jeu est terminé, rediriger vers le leaderboard après 2 secondes
          if (response.completed) {
            setTimeout(() => {
              this.router.navigate(['/sessions', id, 'leaderboard']);
            }, 2000);
          }

          this.submitting.set(false);
        },
        error: (err) => {
          console.error('Erreur lors de la soumission:', err);
          this.error.set(err.error?.message || 'Impossible de soumettre la réponse.');
          this.submitting.set(false);
        },
      });
  }

  getScoreColor(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    if (score >= 50) return 'outline';
    return 'destructive';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  }

  canSubmit(productAnswer: ProductAnswer): boolean {
    return (
      !productAnswer.submitted &&
      productAnswer.guessedPrice !== null &&
      productAnswer.guessedPrice > 0 &&
      !this.submitting()
    );
  }
}
