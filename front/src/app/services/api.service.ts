/**
 * service "général" pour les appels au serveur
 */

import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { error } from 'protractor';

export const headers = {
  Authorization: `Lucca application=${environment.TOKEN}`,
  'Content-type': 'application/json',
};

export type ErrorBody = {
  Status: string;
  Message: string;
};

export const isJsError = (error: any): error is ErrorEvent =>
  error.error instanceof ErrorEvent;

export const isServerError = (error: any): error is ErrorBody => !isJsError(error);

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  redirectObservable = (error: HttpErrorResponse) => {
    if (isJsError(error.error)) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }
    console.error(error.status);

    return throwError(error);
  };

  get<T>(route: string, params?: HttpParams) {
    return this.http
      .get<T>(environment.API_BASEURL + route, {
        headers: headers,
        params,
      })
      .pipe(catchError(this.redirectObservable));
  }

  post<Body, ResponseBody>(route: string, body: Body, params?: HttpParams) {
    return this.http
      .post<ResponseBody>(environment.API_BASEURL + route, body, {
        headers: headers,
        params,
      })
      .pipe(catchError(this.redirectObservable));
  }

  constructor(private http: HttpClient) {}
}
