const path = require('path')
const express = require('express')
const xss = require('xss')
const TeamsService = require('./teams-service')

const teamsRouter = express.Router()
const jsonParser = express.json()

const serializeTeam = team => {
    return {
        id: team.id,
        team_name: xss(team.team_name),
        players: xss(team.players),
        court_id: team.court_id,
    }
}

teamsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        TeamsService.getAllTeams(knexInstance)
            .then(teams => {
                res.json(teams.map(serializeTeam))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { team_name, players, court_id } = req.body
        const newTeam = { team_name, players, court_id }

        for (const [key, value] of Object.entries(newTeam))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })

            TeamsService.insertTeam(
                req.app.get('db'),
                newTeam
            )
                .then(team => {
                    res
                        .status(201)
                        .location(path.posix.join(req.originalUrl, `/${team.id}`))
                        .json(serializeTeam(team))
                })
                .catch(next)
    })

teamsRouter
    .route('/:team_id')
    .all((req, res, next) => {
        TeamsService.getById(
            req.app.get('db'),
            req.params.team_id
        )
            .then(team => {
                if (!team) {
                    return res.status(404).json({
                        error: { message: `Team doesn't exist` }
                    })
                }
                res.team = team
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeTeam(res.team))
    })
    .delete((req, res, next) => {
        TeamsService.deleteTeam(
            req.app.get('db'),
            req.params.team_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { players } = req.body
        const teamToUpdate = { players }

        TeamsService.updateTeam(
            req.app.get('db'),
            req.params.team_id,
            teamToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = teamsRouter