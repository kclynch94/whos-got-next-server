function makeCourtsArray() {
    return [
      {
        id: 1,
        court_name: 'Test Court 1',
        activegame: true,
        facility_id: 1,
      },
      {
        id: 2,
        court_name: 'Test Court 2',
        activegame: true,
        facility_id: 1,
      },
      {
        id: 3,
        court_name: 'Test Court 3',
        activegame: true,
        facility_id: 1,
      },
    ]
  }

  function makeMaliciousCourt() {
    const maliciousCourt =  {
        id: 911,
        court_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        activegame: true,
        facility_id: 1,
      }
    const expectedCourt = {
      ...maliciousCourt,
      court_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    }
    return {
      maliciousCourt,
      expectedCourt,
    }
  }
  
  module.exports = {
    makeCourtsArray,
    makeMaliciousCourt,
  }