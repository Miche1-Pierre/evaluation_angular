import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  theme_id: number;
  name: string;
  price: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductDTO {
  theme_id: number;
  name: string;
  price: number;
  image_url?: string;
}

export interface UpdateProductDTO {
  theme_id?: number;
  name?: string;
  price?: number;
  image_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  /**
   * Récupère tous les produits
   */
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/products`);
  }

  /**
   * Récupère un produit par ID
   */
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/products/${id}`);
  }

  /**
   * Crée un nouveau produit (admin uniquement)
   */
  createProduct(data: CreateProductDTO): Observable<Product> {
    return this.http.post<Product>(`${this.API_URL}/products`, data);
  }

  /**
   * Met à jour un produit (admin uniquement)
   */
  updateProduct(id: number, data: UpdateProductDTO): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/products/${id}`, data);
  }

  /**
   * Supprime un produit (admin uniquement)
   */
  deleteProduct(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/products/${id}`);
  }
}
