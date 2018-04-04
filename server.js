const path = require('path');
const port = process.env.PORT || 5000;

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const sql = require('pga-sql');
const connectionString = process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/weekly_planner";
const pg = require("pg");
const pga = require('pga');
const parse = require('pg-connection-string').parse;
const config = parse(connectionString);
const db = pga(config);

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/public')));
app.use("/public/stylesheets", express.static(__dirname + "/public/stylesheets"));
app.use("/public/scripts", express.static(__dirname + "/public/scripts"));
app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: true
	})
);

app.get('/', handleGet);
app.get('/weeklyUpdate', getWeeklyUpdate);

app.post('/', handlePost);
app.post('/login', handleLogin);
app.post('/signup', handleSignup);
app.post('/logout', handleLogout);

app.listen(port, function() { 
	console.log(`Listening on port ${port}`);
});


function handleGet(req, res) {
	console.log('Received get request...');
	if (!req.session.user) {
		console.log('No session active...');
		res.render('pages/login');
	} else if (req.session.user) {
		console.log('Session is active...');
		getDaysAndTasks(req, res);
	}
}

function handlePost(req, res) {
	console.log('Received post request...');
	if (req.body.available_time != null) {
		console.log('Updating available time...');
		updateAvailableTime(req, res);
	} else if (req.body.task_id != null) {
		console.log('Deleting a task...');
		deleteTask(req, res);
	} else {
		console.log('Creating a task...');
		createNewTask(req, res);
	}
}

function handleLogout(request, response) {
	var result = {success: false};
	if (request.session.user) {
		request.session.destroy();
		console.log('Destroyed session...');
		result = {success: true};
	}
	console.log('Sending json(result) response...');
	response.json(result);
}

function handleSignup(req, res) {
	// Using a helper function to query DB and provide callback after processing
	getUserCredsFromDbSignup(req, res, function(error, dbResult) {
		// Callback function that will be called when the DB done
		if (error || dbResult == null) {
			res.status(500).json({success: false, data: error});
		} else {
			var result = {success: false};
			if (dbResult.length === 0) {
				// Username doesn't already exist
				result = {success: true};

				bcrypt.hash(req.body.password, 8, function(error, hash) {
					if (error) {
						return res.status(500).json({success: false, data: error});
					}

					createNewUser(req.body.username, hash, function (error, dbNewUserResult) {
						if (error) {
							return res.status(500).json({success: false, data: error});
						}
						console.log("Successfully created new user...");
					});
				});
			}
			res.json(result);
		}
	});
}

function handleLogin(req, res) {
	// Using a helper function to query DB and provide callback after processing
	getUserCredsFromDb(req, res, function(error, dbResult) {
		// Callback function that will be called when the DB done
		if (error || dbResult == null) {
			res.status(500).json({success: false, data: error});
		} else {
			var userId   = dbResult[0]["planner_id"];
			var username = dbResult[0]["username"];
			var password = dbResult[0]["password"];
			var result = {success: false};
			
			bcrypt.compare(req.body.password, password, function(err, result) {
				if(result) {
					req.session.user = userId;
					result = {
						success: true,
						data: dbResult
					};
				}
				res.json(result);
			});
		}
	});
}

function createNewUser(username, password, callback) {
	console.log("Inserting new user into DB...");

	var query1 = sql`INSERT INTO planner \
					 (                   \
					   username          \
					 , password          \
				     )                   \
				     VALUES              \
				     (                   \
					   ${username}       \
					 , ${password}       \
					 );`;

	var query2 = sql`INSERT INTO day (name, planner_id)                                               \
					 VALUES                                                                           \
						('Monday',    (SELECT planner_id FROM planner WHERE username = ${username})), \
						('Tuesday',   (SELECT planner_id FROM planner WHERE username = ${username})), \
						('Wednesday', (SELECT planner_id FROM planner WHERE username = ${username})), \
						('Thursday',  (SELECT planner_id FROM planner WHERE username = ${username})), \
						('Friday',    (SELECT planner_id FROM planner WHERE username = ${username})), \
						('Saturday',  (SELECT planner_id FROM planner WHERE username = ${username})), \
						('Sunday',    (SELECT planner_id FROM planner WHERE username = ${username}));`;

	var queries = [query1, query2];

	db.transact(queries, function(err, result) {
		if (err) {
			console.log("Error in query: ")
			console.log(err);
			return callback(err, null);
		}

		// Giving results to callback
		callback(null, result.rows);
	});
}

function getUserCredsFromDb(req, res, callback) {
	console.log("Getting user credentials from DB...");

	var username = req.body.username;
	var query = sql`SELECT planner_id, username, password \
				 	FROM planner                          \
					WHERE username = ${username};`;

	db.query(query, function(err, result) {
		// Done getting data from DB
		if (err) {
			console.log("Error in query: ")
			console.log(err);
			return callback(err, null);
		}

		// Giving results to callback
		callback(null, result.rows);
	});
}

function getUserCredsFromDbSignup(req, res, callback) {
	console.log("Getting user credentials from DB...");

	var username = req.body.username;
	var query = sql`SELECT username \
					FROM planner    \
				  	WHERE username = ${username};`;

	db.query(query, function(err, result) {
		// Done getting data from DB
		if (err) {
			console.log("Error in query: ")
			console.log(err);
			return callback(err, null);
		}

		// Giving results to callback
		callback(null, result.rows);
	});
}

function getWeeklyUpdate(request, response) {
	console.log('Got a request for a weekly update...');

	// Using a helper function to query DB and provide callback after processing
	getWeeklyUpdateFromDb(request.session.user, function(error, result) {
		// Callback function that will be called when the DB done
		if (error || result == null) {
			response.status(500).json({success: false, data: error});
		} else {
			console.log("Received results from database...");
			response.json(result);
		}
	});
}

function getWeeklyUpdateFromDb(userId, callback) {
	console.log("Getting weekly update from DB...");

	var query = sql`SELECT total_work_time_day, total_available_time_day \
					FROM day                                             \
					WHERE planner_id =  ${userId};`;

	db.query(query, function(err, result) {
		if (err) {
			console.log("Error in query: ")
			console.log(err);
			return callback(err, null);
		}

		// Giving results to callback
		callback(null, result.rows);
	});
}

function getDaysAndTasks(request, response) {
	// Use a helper function to query DB and provide callback after processing
	getDaysAndTasksFromDb(request.session.user, function(error, result) {
		// Callback function that will be called when the DB done
		if (error || result == null) {
			response.status(500).json({success: false, data: error});
		} else {
			var days = {};
			days[1]  = {};
			days[2]  = {};
			days[3]  = {};
			days[4]  = {};
			days[5]  = {};
			days[6]  = {};
			days[7]  = {};

			for (const index in result) {
				var dayId = ((parseInt(result[index].day_id) - 1) % 7 + 1);
				days[dayId]["name"]                     = result[index].name;
				days[dayId]["total_available_time_day"] = result[index].total_available_time_day;
				days[dayId]["total_work_time_day"]      = result[index].total_work_time_day;
			}

			response.render('pages/planner', {
				daysAndTasks: result,
				days: days
			});	
		}
	});
}

function getDaysAndTasksFromDb(userId, callback) {
	console.log("Getting days from DB...");

	var query = sql`SELECT                                       \
					  tsk.task_day_id                            \
					, tsk.task_id                                \
					, tsk.planner_id                             \
					, tsk.class                                  \
					, tsk.description                            \
					, tsk.due_time                               \
					, tsk.total_work_time                        \
					, d.day_id, d.name                           \
					, d.total_work_time_day                      \
					, d.total_available_time_day                 \
					, d.planner_id                               \
					FROM                                         \
					(                                            \
						SELECT                                   \
						  td.task_day_id                         \
						, td.task_id                             \
						, td.day_id                              \
						, td.planner_id                          \
						, t.class                                \
						, t.description                          \
						, t.due_time                             \
						, t.total_work_time                      \
						FROM task_day AS td INNER JOIN task AS t \
							ON td.task_id = t.task_id            \
					)                                            \
					AS tsk                                       \
					RIGHT JOIN                                   \
					(                                            \
						SELECT                                   \
						  day_id, name                           \
						, total_work_time_day                    \
						, total_available_time_day               \
						, planner_id                             \
						FROM day                                 \
						WHERE planner_id = ${userId}             \
					)                                            \
					AS d                                         \
						ON tsk.day_id = d.day_id                 \
					ORDER BY tsk.due_time ASC;`;

	db.query(query, function(err, result) {
		// Done getting data from DB; disconnect the client
		if (err) {
			console.log("Error in query: ")
			console.log(err);
			return callback(err, null);
		}
		// Giving results to callback
		callback(null, result.rows);
	});
}

function createNewTask(req, res) {
	insertNewTaskIntoDb(function (error, result) {
		console.log("Inserting new task_day value into DB...");

		var dayId = (parseInt(req.session.user) - 1) * 7 + parseInt(result.last_day_id);
		var query1 = sql`INSERT INTO task_day     \
						 (                        \
						   task_id                \
						 , day_id                 \
						 , planner_id             \
						 )                        \
						 VALUES                   \
						 (						  \
						   ${result.last_task_id} \
						 , ${dayId}	              \
						 , ${req.session.user}	  \
						 );`;

		var query2 = sql`UPDATE day                                                          \                                     
						 SET total_work_time_day = total_work_time_day + ${result.work_time} \
						 WHERE day_id = ${dayId};`;

		var queries = [query1, query2];

		db.transact(queries, function(err, result) {
			// Done getting data from DB; disconnect the client
			if (err) {
				console.log("Error connecting to DB: ")
				console.log(err);
			}
			getDaysAndTasks(req, res);
		});
		console.log("Inserted new task_day value...");		
	}, req, res);
}

function insertNewTaskIntoDb(callback, req, res) {
	var course = req.body.course;
	var description = req.body.description;
	var due = req.body.due + ":00";
	var work_time = req.body.work_time;
	var dayId = req.body.day_id;

	console.log("Inserting new task into DB...");

	var query = sql`INSERT INTO task  \
					(                 \
					  class           \
					, description     \
					, due_time        \
					, total_work_time \
					)                 \
					VALUES            \
					(                 \
					  ${course}       \
					, ${description}  \
					, ${due}          \
					, ${work_time}    \
				    )                 \
					RETURNING task_id;`;

	db.query(query, function(err, result) {
		// Done getting data from DB; disconnect the client
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
			return callback(err, null);
		}

		callback(null, {
			last_task_id: result.rows[0].task_id,
			last_day_id: dayId,
			work_time: work_time
		});
	});
	console.log("Inserted new task...");
}

function updateAvailableTime(request, response) {
	console.log("Updating day table...");

	var dayId = (parseInt(request.session.user) - 1) * 7 + parseInt(request.body.day_id);

	var query = sql`UPDATE day                                                    \
					SET total_available_time_day = ${request.body.available_time} \
					WHERE day_id = ${dayId};`;

	db.query(query, function(err, result) {
		// Done getting data from DB; disconnect the client
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
		}
		
		getDaysAndTasks(request, response);
	});
	console.log("Updated available time in day table...");			
}

function deleteTask(request, response) {	
	console.log("Deleting task #" + request.body.task_id);

	var query1 = sql`UPDATE day                                      \
					 SET total_work_time_day = total_work_time_day - \
					 (                                               \
					 	SELECT total_work_time                       \
					 	FROM task                                    \
					 	WHERE task_id = ${request.body.task_id}      \
					 )                                               \
					 WHERE day_id =                                  \
					 (                                               \
					 	SELECT day_id                                \
					 	FROM task_day                                \
					 	WHERE task_id = ${request.body.task_id}      \
					 );`;


	var query2 = sql`DELETE                                     \
					 FROM task_day                              \
					 WHERE task_id = ${request.body.task_id};`;
	
	var query3 = sql`DELETE                                     \
					 FROM task                                  \
					 WHERE task_id = ${request.body.task_id};`;

	var queries = [query1, query2, query3]

	db.transact(queries, function(err, result) {
		// Done getting data from DB; disconnect the client
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
		}
		if(result) {
			getDaysAndTasks(request, response);
		}
	});
	console.log("Deleted task...");			
}