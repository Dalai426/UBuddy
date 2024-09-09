import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { map, Observable } from "rxjs";

export type Response<T> = {
    status: boolean;
    statusCode: number;
    path: string;
    message: string;
    data: T;
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(map((res: unknown) => this.responseHandler(res, context)));
    }

    responseHandler(res: any, context: ExecutionContext) {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const statusCode = response.statusCode;
        const message = response.message;

        return {
            status: true,
            message: message,
            statusCode,
            data: res,
        };
    }
}
