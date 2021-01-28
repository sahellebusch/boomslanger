import Boomslinger from './index';
import Pgp from 'pg-promise';

const pgp = Pgp();
const postgresUrl =
  'postgres://test_user:test_password@localhost:65432/test_db';
const testConnection = pgp(postgresUrl);

interface MotionPicture {
  uuid: string;
  id: number;
  title: string;
  dateProd: Date;
  len: number;
  meta: Record<any, any>;
}

describe('Boomslinger', () => {
  const subject = new Boomslinger({ postgresUrl });

  afterEach(async () => {
    await testConnection.none('TRUNCATE motion_pictures RESTART IDENTITY');
  });

  afterAll(() => {
    subject.close();
    pgp.end();
  });

  describe('#injectOne', () => {
    it('injects an object', async () => {
      const testMotionPicture: Partial<MotionPicture> = {
        title: 'Slingin the booms',
        dateProd: new Date(),
        len: 123,
        meta: { thisMovie: 'is awesome' },
      };

      const result = await subject.injectOne<Partial<MotionPicture>>(
        'motionPictures',
        testMotionPicture
      );
      expect(result).toEqual({
        ...testMotionPicture,
        id: 1,
        uuid: expect.any(String),
      });
      const count = await testConnection.one(
        'SELECT COUNT(id) from motion_pictures'
      );
      expect(count).toEqual({ count: '1' });
    });
  });

  describe('#injectMany', () => {
    it('injects an array of objects', async () => {
      const testMotionPictures: Partial<MotionPicture>[] = [
        {
          title: 'Slingin the booms',
          dateProd: new Date(),
          len: 123,
          meta: { thisMovie: 'is awesome' },
        },
        {
          title: 'Hobo Baggins',
          dateProd: new Date(),
          len: 543,
          meta: { thisMovie: 'is lame' },
        },
      ];

      const result = await subject.injectMany<Partial<MotionPicture>>(
        'motionPictures',
        testMotionPictures
      );
      result.forEach((mp, index) => {
        expect(mp).toEqual({ ...mp, id: index + 1 });
      });
      const count = await testConnection.one(
        'SELECT COUNT(id) from motion_pictures'
      );
      expect(count).toEqual({ count: '2' });
    });
  });

  describe('#truncateTable', () => {
    it('truncates a table', async () => {
      const testMotionPicture: Partial<MotionPicture> = {
        title: 'Slingin the booms',
        dateProd: new Date(),
        len: 123,
        meta: { thisMovie: 'is awesome' },
      };

      await subject.injectOne<Partial<MotionPicture>>(
        'motionPictures',
        testMotionPicture
      );
      await subject.truncateTable('motionPictures');
      const count = await testConnection.one(
        'SELECT COUNT(id) from motion_pictures'
      );
      expect(count).toEqual({ count: '0' });
    });
  });

  describe('#findOne', () => {
    let motionPicturesInDb: Partial<MotionPicture>[];

    beforeEach(async () => {
      const testMotionPictures: Partial<MotionPicture>[] = [
        {
          title: 'Slingin the booms',
          dateProd: new Date(),
          len: 123,
          meta: { thisMovie: 'is awesome' },
        },
        {
          title: 'Hobo Baggins',
          dateProd: new Date(),
          len: 543,
          meta: { thisMovie: 'is lame' },
        },
      ];

      motionPicturesInDb = await subject.injectMany<Partial<MotionPicture>>(
        'motionPictures',
        testMotionPictures
      );
    });

    it('will return one object when exists in the database', async () => {
      const res = await subject.findOne<MotionPicture>('motionPictures', {
        title: 'Slingin the booms',
      });
      expect(res).toEqual(motionPicturesInDb[0]);
    });

    it('can find one with uuid type', async () => {
      const res = await subject.findOne<MotionPicture>('motionPictures', {
        uuid: motionPicturesInDb[0].uuid,
      });
      expect(res).toEqual(motionPicturesInDb[0]);
    });
  });
});
