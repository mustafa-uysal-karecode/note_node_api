const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const genericPool = require('generic-pool');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const pool = genericPool.createPool({
    create: function() {
      const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'node_todo'
      });
  
      return new Promise((resolve, reject) => {
        connection.connect(function(error) {
          if (error) {
            reject(error);
          } else {
            resolve(connection);
          }
        });
      });
    },
    destroy: function(connection) {
      return new Promise((resolve, reject) => {
        connection.end(function(error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    },
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000
  });
  
  function getAllUsers() {
    return new Promise((resolve, reject) => {
      pool.acquire()
        .then(connection => {
          connection.query('SELECT * FROM todo_list where status=1', (error, results, fields) => {
            pool.release(connection);
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  }
  
  // Kullanım örneği

  function addNewTodoListData(data) {
    return new Promise((resolve, reject) => {
      pool.acquire()
        .then(connection => {
          connection.query('INSERT INTO todo_list SET ?', data, (error, results, fields) => {
            pool.release(connection);
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  function delTodoListData(data) {
   // console.log(data)
    return new Promise((resolve, reject) => {
      pool.acquire()
        .then(connection => {
          connection.query('UPDATE todo_list SET status=0 where id=?', data, (error, results, fields) => {
            pool.release(connection);
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  function editTodoListData(todo, id) {
    return new Promise((resolve, reject) => {
      pool.acquire()
        .then(connection => {
          connection.query('UPDATE todo_list SET todo="'+todo+'" where id=?', id, (error, results, fields) => {
            pool.release(connection);
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  }
  
app.post('/add_note', (req, res) => {

    const reqData = req.body;

   // console.log(reqData.todo)
    
    const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const day = now.getDate();
const hour = now.getHours();
const minute = now.getMinutes();
const second = now.getSeconds();

const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;


    const data = {
        'todo': reqData.todo,
        'created_at': formattedDate + " " + formattedTime,
        'status': 1
    }

    var result = addNewTodoListData(data)
    .then(results => {
      console.log("New data inserted successfully.");
      return true;
    })
    .catch(error => {
      console.error(error);
      return false;
    });

    if (result) {
        res.json({'status': true});
    } else {
        res.json({'status': false});
    }

});

app.get('/get_notes', async (req, res) => {
    try {
        const results = await getAllUsers()
        .then(users => {
          //console.log(users);
          return users
        })
        .catch(error => {
          console.error(error);
        });
        //console.log('Results: ', results);
        res.json({'status': true, 'data' : results});
      } catch (error) {
        //console.error('Error getting data: ', error);
        res.json({'status': false, 'data' : error});
      }
  
});
app.post('/del_note', async (req, res) => {
  try {

      const results = await delTodoListData(req.body.id)
      .then(users => {
        //console.log(users);
        return true
      })
      .catch(error => {
        console.error(error);
        return false
      });
      //console.log('Results: ', results);
      res.json({'status': true});
    } catch (error) {
      console.error('Error getting data: ', error);
      res.json({'status': false});
    }

});
app.post('/edit_note', async (req, res) => {
  try {

      const results = await editTodoListData(req.body.todo, req.body.id)
      .then(users => {
        //console.log(users);
        return true
      })
      .catch(error => {
        console.error(error);
        return false
      });
      //console.log('Results: ', results);
      res.json({'status': true});
    } catch (error) {
      console.error('Error getting data: ', error);
      res.json({'status': false});
    }

});
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
