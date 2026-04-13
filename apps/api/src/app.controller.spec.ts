import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appService = {
    getStatus: jest.fn(() => ({
      message: 'API QLTBCNTT đang hoạt động',
      timestamp: '2026-04-13T00:00:00.000Z',
    })),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API status', () => {
      expect(appController.getStatus()).toEqual({
        message: 'API QLTBCNTT đang hoạt động',
        timestamp: '2026-04-13T00:00:00.000Z',
      });
    });
  });
});
