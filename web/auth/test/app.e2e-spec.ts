import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      request(app.getHttpServer())
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .get('/')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect(200)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .expect('Hello World!')
    );
  });
});
