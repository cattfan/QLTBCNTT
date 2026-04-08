import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor, HttpExceptionFilter } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kiểm tra dữ liệu đầu vào tự động, trả lỗi tiếng Việt
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Loại bỏ các trường không khai báo trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu client gửi trường thừa
      transform: true,            // Tự động chuyển đổi kiểu dữ liệu
    }),
  );

  // Đóng gói mọi phản hồi thành { success, data, message }
  app.useGlobalInterceptors(new TransformInterceptor());

  // Xử lý lỗi tập trung
  app.useGlobalFilters(new HttpExceptionFilter());

  // Cho phép Frontend gọi API từ domain khác
  app.enableCors();

  await app.listen(process.env.PORT ?? 1005);
}
bootstrap();
