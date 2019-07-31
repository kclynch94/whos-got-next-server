const path = require('path')
const express = require('express')
const xss = require('xss')
const CourtsService = require('./courts-service')

const courtsRouter = express.Router()
const jsonParser = express.json()

const serializeCourt = court => {
    return {
        id: court.id,
        court_name: xss(court.court_name),
        activegame: court.activegame,
        facility_id: court.facility_id,
    }
}

courtsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        CourtsService.getAllCourts(knexInstance)
            .then(courts => {
                res.json(courts.map(serializeCourt))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { court_name, activegame, facility_id } = req.body
        const newCourt = { court_name, activegame, facility_id }

        for (const [key, value] of Object.entries(newCourt))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })

            CourtsService.insertCourt(
                req.app.get('db'),
                newCourt
            )
                .then(court => {
                    res
                        .status(201)
                        .location(path.posix.join(req.originalUrl, `/${court.id}`))
                        .json(serializeCourt(court))
                })
                .catch(next)
    })

courtsRouter
    .route('/:court_id')
    .all((req, res, next) => {
        CourtsService.getById(
            req.app.get('db'),
            req.params.court_id
        )
            .then(court => {
                if (!court) {
                    return res.status(404).json({
                        error: { message: `Court doesn't exist` }
                    })
                }
                res.court = court
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeCourt(res.court))
    })
    .delete((req, res, next) => {
        CourtsService.deleteCourt(
            req.app.get('db'),
            req.params.court_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { activegame } = req.body
        const courtToUpdate = { activegame }
        CourtsService.updateCourt(
            req.app.get('db'),
            req.params.court_id,
            courtToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = courtsRouter