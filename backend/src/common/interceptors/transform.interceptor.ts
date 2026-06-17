import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { MSG } from '../i18n/messages.en';
import { ApiResponse } from '../types/api-response.type';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data?.success !== undefined) return data;
        return {
          success: true,
          message: MSG.OK,
          data,
        };
      }),
    );
  }
}
