function makeTeamsArray() {
    return [
      {
        id: 1,
        team_name: 'Test Team 1',
        players: [Kevin, Mark, Tom],
        court_id: 1,
      },
      {
        id: 2,
        team_name: 'Test Team 2',
        players: [Jeff, Mark, Tom],
        court_id: 1,
      },
      {
        id: 3,
        team_name: 'Test Team 3',
        players: [Jared, Mark, Tom],
        court_id: 1,
      },
    ]
  }
  
  function makeMaliciousTeam() {
    const maliciousTeam = {
        id: 1,
        team_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        players: [Kevin, Mark, Tom],
        court_id: 1,
      }
    const expectedTeam = {
      ...maliciousTeam,
      team_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    }
    return {
      maliciousTeam,
      expectedTeam,
    }
  }
  
  module.exports = {
    makeTeamsArray,
    makeMaliciousTeam,
  }