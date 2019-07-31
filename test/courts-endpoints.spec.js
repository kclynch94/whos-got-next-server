const knex = require('knex')
const fixtures = require('./courts-fixtures')
const app = require('../src/app')

describe('Courts Endpoints', () => {
    let db
  
    before('make knex instance', () => {
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
      })
      app.set('db', db)
    })
  
    after('disconnect from db', () => db.destroy())
  
    before('cleanup', () => db('courts').truncate())
  
    afterEach('cleanup', () => db('courts').truncate())
  
    describe(`Unauthorized requests`, () => {
      const testCourts = fixtures.makeCourtsArray()
  
      beforeEach('insert courts', () => {
        return db
          .into('courts')
          .insert(testCourts)
      })
  
      it(`responds with 401 Unauthorized for GET /api/courts`, () => {
        return supertest(app)
          .get('/api/courts')
          .expect(401, { error: 'Unauthorized request' })
      })
  
      it(`responds with 401 Unauthorized for POST /api/courts`, () => {
        return supertest(app)
          .post('/api/courts')
          .send({ court_name: 'Test Court', activegame: true, facility_id: 1 })
          .expect(401, { error: 'Unauthorized request' })
      })
  
      it(`responds with 401 Unauthorized for GET /api/courts/:id`, () => {
        const secondCourt = testCourts[1]
        return supertest(app)
          .get(`/api/courts/${secondCourt.id}`)
          .expect(401, { error: 'Unauthorized request' })
      })
  
      it(`responds with 401 Unauthorized for DELETE /api/courts/:id`, () => {
        const aCourt = testCourts[1]
        return supertest(app)
          .delete(`/api/courts/${aCourt.id}`)
          .expect(401, { error: 'Unauthorized request' })
      })
  
      it(`responds with 401 Unauthorized for PATCH /api/courts/:id`, () => {
        const aCourt = testCourts[1]
        return supertest(app)
          .patch(`/api/courts/${aCourt.id}`)
          .send({ court_name: 'Updated Test Court' })
          .expect(401, { error: 'Unauthorized request' })
      })
    })
  
    describe('GET /api/courts', () => {
      context(`Given no courts`, () => {
        it(`responds with 200 and an empty list`, () => {
          return supertest(app)
            .get('/api/courts')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, [])
        })
      })
  
      context('Given there are courts in the database', () => {
        const testCourts = fixtures.makeCourtsArray()
  
        beforeEach('insert courts', () => {
          return db
            .into('courts')
            .insert(testCourts)
        })
  
        it('gets the courts from the store', () => {
          return supertest(app)
            .get('/api/courts')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, testCourts)
        })
      })
  
      context(`Given an XSS attack court`, () => {
        const { maliciousCourt, expectedCourt } = fixtures.makeMaliciousCourt()
  
        beforeEach('insert malicious court', () => {
          return db
            .into('courts')
            .insert([maliciousCourt])
        })
  
        it('removes XSS attack content', () => {
          return supertest(app)
            .get(`/api/courts`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200)
            .expect(res => {
              expect(res.body[0].court_name).to.eql(expectedCourt.court_name)
            })
        })
      })
    })
  
    describe('GET /api/courts/:id', () => {
      context(`Given no courts`, () => {
        it(`responds 404 whe court doesn't exist`, () => {
          return supertest(app)
            .get(`/api/courts/123`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, {
              error: { message: `Court Not Found` }
            })
        })
      })
  
      context('Given there are courts in the database', () => {
        const testCourts = fixtures.makeCourtsArray()
  
        beforeEach('insert courts', () => {
          return db
            .into('courts')
            .insert(testCourts)
        })
  
        it('responds with 200 and the specified court', () => {
          const courtId = 2
          const expectedCourt = testCourts[courtId - 1]
          return supertest(app)
            .get(`/api/courts/${courtId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200, expectedCourt)
        })
      })
  
      context(`Given an XSS attack court`, () => {
        const { maliciousCourt, expectedCourt } = fixtures.makeMaliciousCourt()
  
        beforeEach('insert malicious court', () => {
          return db
            .into('courts')
            .insert([maliciousCourt])
        })
  
        it('removes XSS attack content', () => {
          return supertest(app)
            .get(`/api/courts/${maliciousCourt.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200)
            .expect(res => {
              expect(res.body.court_name).to.eql(expectedCourt.court_name)
            })
        })
      })
    })
  
    describe('DELETE /api/courts/:id', () => {
      context(`Given no courts`, () => {
        it(`responds 404 whe court doesn't exist`, () => {
          return supertest(app)
            .delete(`/api/courts/123`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, {
              error: { message: `Court Not Found` }
            })
        })
      })
  
      context('Given there are courts in the database', () => {
        const testCourts = fixtures.makeCourtsArray()
  
        beforeEach('insert courts', () => {
          return db
            .into('courts')
            .insert(testCourts)
        })
  
        it('removes the court by ID from the store', () => {
          const idToRemove = 2
          const expectedCourts = testCourts.filter(c => c.id !== idToRemove)
          return supertest(app)
            .delete(`/api/courts/${idToRemove}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(204)
            .then(() =>
              supertest(app)
                .get(`/api/courts`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(expectedCourts)
            )
        })
      })
    })
  
    describe('POST /api/courts', () => {
      ['court_name', 'activegame', 'facility_id'].forEach(field => {
        const newCourt = {
          court_name: 'test-court',
          activegame: true,
          facility_id: 1,
        }
  
        it(`responds with 400 missing '${field}' if not supplied`, () => {
          delete newCourt[field]
  
          return supertest(app)
            .post(`/api/courts`)
            .send(newCourt)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: { message: `'${field}' is required` }
            })
        })
      })
  
      it('adds a new court to the store', () => {
        const newCourt = {
            court_name: 'test-court',
            activegame: true,
            facility_id: 1,
        }
        return supertest(app)
          .post(`/api/courts`)
          .send(newCourt)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.court_name).to.eql(newCourt.court_name)
            expect(res.body.activegame).to.eql(newCourt.activegame)
            expect(res.body.facility_id).to.eql(newCourt.facility_id)
            expect(res.body).to.have.property('id')
            expect(res.headers.location).to.eql(`/api/courts/${res.body.id}`)
          })
          .then(res =>
            supertest(app)
              .get(`/api/courts/${res.body.id}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(res.body)
          )
      })
  
      it('removes XSS attack content from response', () => {
        const { maliciousCourt, expectedCourt } = fixtures.makeMaliciousCourt()
        return supertest(app)
          .post(`/api/courts`)
          .send(maliciousCourt)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expect(res.body.court_name).to.eql(expectedCourt.court_anem)
          })
      })
    })
  
    describe(`PATCH /api/courts/:court_id`, () => {
      context(`Given no courts`, () => {
        it(`responds with 404`, () => {
          const courtId = 123456
          return supertest(app)
            .patch(`/api/courts/${courtId}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(404, { error: { message: `Court Not Found` } })
        })
      })
  
      context('Given there are courts in the database', () => {
        const testCourts = fixtures.makeCourtsArray()
  
        beforeEach('insert courts', () => {
          return db
            .into('courts')
            .insert(testCourts)
        })
  
        it('responds with 204 and updates the court', () => {
          const idToUpdate = 2
          const updateCourt = {
            court_name: 'updated court name',
            activegame: false,
          }
          const expectedCourt = {
            ...testCourts[idToUpdate - 1],
            ...updateCourt
          }
          return supertest(app)
            .patch(`/api/courts/${idToUpdate}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send(updateCourt)
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/api/courts/${idToUpdate}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(expectedCourt)
            )
        })
  
        it(`responds with 400 when no required fields supplied`, () => {
          const idToUpdate = 2
          return supertest(app)
            .patch(`/api/courts/${idToUpdate}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send({ irrelevantField: 'foo' })
            .expect(400, {
              error: {
                message: `Request body must contain either 'court_name' or 'activegame'`
              }
            })
        })
  
        it(`responds with 204 when updating only a subset of fields`, () => {
          const idToUpdate = 2
          const updateCourt = {
            court_name: 'updated court name',
          }
          const expectedCourt = {
            ...testCourts[idToUpdate - 1],
            ...updateCourt
          }
  
          return supertest(app)
            .patch(`/api/courts/${idToUpdate}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .send({
              ...updateCourt,
              fieldToIgnore: 'should not be in GET response'
            })
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/api/courts/${idToUpdate}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(expectedCourt)
            )
        })
      })
    })
  })