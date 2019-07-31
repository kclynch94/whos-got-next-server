const path = require('path')
const express = require('express')
const xss = require('xss')
const FacilitiesService = require('./facilities-service')

const facilitiesRouter = express.Router()
const jsonParser = express.json()

const serializeFacility = facility => {
    return {
        id: facility.id,
        facility_name: xss(facility.facility_name),
        org_id: facility.org_id,
    }
}

facilitiesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        FacilitiesService.getAllFacilities(knexInstance)
            .then(facilities => {
                res.json(facilities.map(serializeFacility))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { facility_name, org_id } = req.body
        const newFacility = { facility_name, org_id }

        for (const [key, value] of Object.entries(newFacility))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })

            FacilitiesService.insertFacility(
                req.app.get('db'),
                newFacility
            )
                .then(facility => {
                    res
                        .status(201)
                        .location(path.posix.join(req.originalUrl, `/${facility.id}`))
                        .json(serializeFacility(facility))
                })
                .catch(next)
    })

facilitiesRouter
    .route('/:facility_id')
    .all((req, res, next) => {
        FacilitiesService.getById(
            req.app.get('db'),
            req.params.facility_id
        )
            .then(facility => {
                if (!facility) {
                    return res.status(404).json({
                        error: { message: `Facility doesn't exist` }
                    })
                }
                res.facility = facility
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeFacility(res.facility))
    })
    .delete((req, res, next) => {
        FacilitiesService.deleteFacility(
            req.app.get('db'),
            req.params.facility_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { facility_name } = req.body
        const facilityToUpdate = {facility_name}

        FacilitiesService.updateFacilitiy(
            req.app.get('db'),
            req.params.facility_id,
            facilityToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = facilitiesRouter