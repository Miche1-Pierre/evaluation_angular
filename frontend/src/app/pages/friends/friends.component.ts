import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FriendsService, Friend, FriendRequest } from '../../core/services/friends.service';
import { ZardButtonComponent } from '../../shared/components/button/button.component';
import { ZardCardComponent } from '../../shared/components/card/card.component';
import { ZardBadgeComponent } from '../../shared/components/badge/badge.component';
import { ZardInputDirective } from '../../shared/components/input/input.directive';
import { ThemeToggleComponent } from '../../core/components/theme-toggle/theme-toggle.component';

type FriendsTab = 'friends' | 'received' | 'sent';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardInputDirective,
    ThemeToggleComponent,
  ],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css'],
})
export class FriendsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly friendsService = inject(FriendsService);

  activeTab = signal<FriendsTab>('friends');
  loading = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  friends = signal<Friend[]>([]);
  pendingRequests = signal<FriendRequest[]>([]);
  sentRequests = signal<FriendRequest[]>([]);

  requestForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadAllData();
  }

  private initForm(): void {
    this.requestForm = this.fb.group({
      receiver_email: ['', [Validators.required, Validators.email]],
    });
  }

  private loadAllData(): void {
    this.loading.set(true);
    this.loadFriends();
    this.loadPendingRequests();
    this.loadSentRequests();
  }

  private loadFriends(): void {
    this.friendsService.getFriendsList().subscribe({
      next: (friends) => {
        this.friends.set(friends);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des amis:', err);
        this.error.set('Impossible de charger la liste des amis.');
        this.loading.set(false);
      },
    });
  }

  private loadPendingRequests(): void {
    this.friendsService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests.set(requests);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des demandes reçues:', err);
      },
    });
  }

  private loadSentRequests(): void {
    this.friendsService.getSentRequests().subscribe({
      next: (requests) => {
        this.sentRequests.set(requests);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des demandes envoyées:', err);
      },
    });
  }

  setActiveTab(tab: FriendsTab): void {
    this.activeTab.set(tab);
    this.error.set(null);
    this.successMessage.set(null);
  }

  onSubmitRequest(): void {
    if (this.requestForm.invalid) {
      this.error.set('Veuillez entrer un email valide.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const email = this.requestForm.value.receiver_email;
    this.friendsService.sendFriendRequest({ receiver_email: email }).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.requestForm.reset();
        this.loadSentRequests();
        this.submitting.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de l\'envoi de la demande:', err);
        this.error.set(err.error?.error || 'Impossible d\'envoyer la demande d\'ami.');
        this.submitting.set(false);
      },
    });
  }

  acceptRequest(requestId: number): void {
    this.friendsService.acceptFriendRequest(requestId).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.loadAllData();
      },
      error: (err) => {
        console.error('Erreur lors de l\'acceptation:', err);
        this.error.set(err.error?.error || 'Impossible d\'accepter la demande.');
      },
    });
  }

  rejectRequest(requestId: number): void {
    this.friendsService.rejectFriendRequest(requestId).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.loadPendingRequests();
      },
      error: (err) => {
        console.error('Erreur lors du refus:', err);
        this.error.set(err.error?.error || 'Impossible de refuser la demande.');
      },
    });
  }

  cancelRequest(requestId: number): void {
    this.friendsService.deleteFriendRequest(requestId).subscribe({
      next: () => {
        this.successMessage.set('Demande annulée avec succès');
        this.loadSentRequests();
      },
      error: () => {
        this.error.set('Impossible d\'annuler la demande.');
      },
    });
  }

  removeFriend(userId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet ami ?')) {
      return;
    }

    this.friendsService.removeFriend(userId).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.loadFriends();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error.set(err.error?.error || 'Impossible de retirer cet ami.');
      },
    });
  }

  get receiverEmail() {
    return this.requestForm.get('receiver_email');
  }
}
