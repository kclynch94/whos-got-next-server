const path = require('path')
const express = require('express')
const xss = require('xss')
const OrganizationsService = require('./organizations-service')

const organizationsRouter = express.Router()
const jsonParser = express.json()

const serializeOrganization = organization => {
    return {
        id: organization.id,
        org_name: xss(organization.org_name)
    }
}

organizationsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        OrganizationsService.getAllOrganizations(knexInstance)
            .then(organizations => {
                res.json(organizations.map(serializeOrganization))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { org_name } = req.body
        const newOrg = { org_name }

        for (const [key, value] of Object.entries(newOrg))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })

            OrganizationsService.insertOrg(
                req.app.get('db'),
                newOrg
            )
                .then(organization => {
                    res
                        .status(201)
                        .location(path.posix.join(req.originalUrl, `/${organization.id}`))
                        .json(serializeOrganization(organization))
                })
                .catch(next)
    })

organizationsRouter
    .route('/:organization_id')
    .all((req, res, next) => {
        OrganizationsService.getById(
            req.app.get('db'),
            req.params.organization_id
        )
            .then(organization => {
                if (!organization) {
                    return res.status(404).json({
                        error: { message: `Organization doesn't exist` }
                    })
                }
                res.organization = organization
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeOrganization(res.organization))
    })
    .delete((req, res, next) => {
        OrganizationsService.deleteOrganization(
            req.app.get('db'),
            req.params.organization_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { org_name } = req.body
        const orgToUpdate = {org_name}

        OrganizationsService.updateOrg(
            req.app.get('db'),
            req.params.organization_id,
            orgToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = organizationsRouter