import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Theme, Product } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ThemesService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  /**
   * Récupère tous les thèmes
   */
  getThemes(): Observable<Theme[]> {
    return this.http.get<Theme[]>(`${this.API_URL}/themes`);
  }

  /**
   * Récupère un thème par ID
   */
  getThemeById(themeId: number): Observable<Theme> {
    return this.http.get<Theme>(`${this.API_URL}/themes/${themeId}`);
  }

  /**
   * Récupère tous les produits d'un thème
   */
  getThemeProducts(themeId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/themes/${themeId}/products`);
  }
}
