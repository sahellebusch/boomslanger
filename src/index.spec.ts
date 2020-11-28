import Boomslanger from './index';
import Pgp from 'pg-promise';

const pgp = Pgp();
const postgresUrl =
  'postgres://test_user:test_password@localhost:65432/test_db';
const testConnection = pgp(postgresUrl);

interface Film {
  id: number;
  title: string;
  dateProd: Date;
  len: number;
  meta: Record<any, any>;
}

describe('Boomslanger', () => {
  const subject = new Boomslanger({ postgresUrl });

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
        title: 'Slangin the booms',
        dateProd: new Date(),
        len: 123,
        meta: { thisMovie: 'is awesome' },
      };

      const result = await subject.injectOne<Partial<Film>>('films', testFilm);
      expect(result).toEqual({ ...testFilm, id: 1 });
    });
  });

  describe('#injectMany', () => {
    it('injects an array of objects', async () => {
      const testFilms: Partial<Film>[] = [
        {
          title: 'Slangin the booms',
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
    });
  });

  describe('#truncateTable', () => {
    it('truncates a table', async () => {
      const testFilm: Partial<Film> = {
        title: 'Slangin the booms',
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
});
