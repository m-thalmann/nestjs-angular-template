import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = await module.resolve<AppController>(AppController);
  });

  describe('getMessage', () => {
    it('should return api information', () => {
      expect(controller.getMessage()).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: expect.any(String),
      });
    });
  });
});
