import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T | StreamableFile,
  ApiResponse<T> | StreamableFile
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | StreamableFile> {
    return next.handle().pipe(
      map((data: T | StreamableFile | null | undefined) => {
        if (data instanceof StreamableFile) {
          return data;
        }

        return {
          success: true,
          data: data ?? null,
          message: 'Thanh cong',
        };
      }),
    );
  }
}
