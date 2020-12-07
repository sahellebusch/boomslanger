import Boomslinger from './index';
import Pgp from 'pg-promise';

const pgp = Pgp();
const postgresUrl =
  'postgres://test_user:test_password@localhost:65432/test_db';
const testConnection = pgp(postgresUrl);

interface Film {
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
    await testConnection.none('TRUNCATE films RESTART IDENTITY');
  });

  afterAll(() => {
    subject.close();
    pgp.end();
  });

  describe('#injectOne', () => {
    it('injects an object', async () => {
      const testFilm: Partial<Film> = {
        title: 'Slingin the booms',
        dateProd: new Date(),
        len: 123,
        meta: { thisMovie: 'is awesome' },
      };

      const result = await subject.injectOne<Partial<Film>>('films', testFilm);
      expect(result).toEqual({ ...testFilm, id: 1, uuid: expect.any(String) });
      const count = await testConnection.one('SELECT COUNT(id) from films');
      expect(count).toEqual({ count: '1' });
    });
  });

  describe('#injectMany', () => {
    it('injects an array of objects', async () => {
      const testFilms: Partial<Film>[] = [
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

      const result = await subject.injectMany<Partial<Film>>(
        'films',
        testFilms
      );
      result.forEach((film, index) => {
        expect(film).toEqual({ ...film, id: index + 1 });
      });
      const count = await testConnection.one('SELECT COUNT(id) from films');
      expect(count).toEqual({ count: '2' });
    });
  });

  describe('#truncateTable', () => {
    it('truncates a table', async () => {
      const testFilm: Partial<Film> = {
        title: 'Slingin the booms',
        dateProd: new Date(),
        len: 123,
        meta: { thisMovie: 'is awesome' },
      };

      await subject.injectOne<Partial<Film>>('films', testFilm);
      await subject.truncateTable('films');
      const count = await testConnection.one('SELECT COUNT(id) from films');
      expect(count).toEqual({ count: '0' });
    });
  });

  describe('#findOne', () => {
    let filmsInDb: Partial<Film>[];

    beforeEach(async () => {
      const testFilms: Partial<Film>[] = [
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

      filmsInDb = await subject.injectMany<Partial<Film>>('films', testFilms);
    });

    it('will return one object when exists in the database', async () => {
      const res = await subject.findOne<Film>('films', {
        title: 'Slingin the booms',
      });
      expect(res).toEqual(filmsInDb[0]);
    });

    it('can find one with uuid type', async () => {
      const res = await subject.findOne<Film>('films', {
        uuid: filmsInDb[0].uuid,
      });
      expect(res).toEqual(filmsInDb[0]);
    });
  });
});
