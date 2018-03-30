const path = require('path');
const PORT = process.env.PORT || 5000;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const pg = require("pg");
const connectionString = process.env.DATABASE_URL || "postgres://test_user:password@localhost:5432/weekly_planner";
const session = require('express-session');

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/public')));
app.use("/public/stylesheets", express.static(__dirname + "/public/stylesheets"));
app.use("/public/scripts", express.static(__dirname + "/public/scripts"));
app.use(session({
	secret: 'my-super-secret-secret!',
	resave: false,
	saveUninitialized: true
	})
);

app.get('/', function(req, res) {
	console.log('Received get request...');
	if (!req.session.user) {
		console.log('No session active...');
		res.render('pages/login');
	} else if (req.session.user) {
		console.log('Session is active...');
		getDaysAndTasks(req, res);
	}
});

app.get('/weeklyUpdate', function (req, res) {
	console.log('Got a request for an update...');
	getWeeklyUpdate(req, res);
});

app.post('/', function(req, res) {
	if (req.body.available_time != null) {
		updateAvailableTime(req, res);
	} else if (req.body.task_id != null) {
		deleteTask(req, res);
	} else {
		createNewTask(req, res);
	}
});

app.post('/login', function handleLogin(req, res) {
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

			console.log("username form db: " + username);
			console.log("password form db: " + password);

			// We should do better error checking here to make sure the parameters are present
			if (req.body.username == username && req.body.password == password) {
				req.session.user = userId;
				result = {
					success: true,
					data: dbResult
				};
			}
			
			res.json(result);
		}
	});
});

app.post('/logout', function handleLogout(request, response) {
	var result = {success: false};

	// We should do better error checking here to make sure the parameters are present
	if (request.session.user) {
		request.session.destroy();
		console.log('Destroyed session...');
		console.log('Setting result.success: true...');
		result = {success: true};
	}

	console.log('Sending json(result) response...');
	response.json(result);
});

app.listen(PORT, function() { 
	console.log(`Listening on port ${ PORT }`);
});

function getUserCredsFromDb(req, res, callback) {
	console.log("Getting user credentials from DB...");

	var client = new pg.Client(connectionString);

	client.connect(function(err) {
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
			callback(err, null);
		}

		var sql =  "SELECT planner_id, username, password " +
				   "FROM planner "                          +
				   "WHERE username = '" + req.body.username + 
				   "' AND password = '" + req.body.password + 
				   "'";

		var query = client.query(sql, function(err, result) {
			// Done getting data from DB; disconnect the client
			client.end(function(err) {
				if (err) throw err;
			});

			if (err) {
				console.log("Error in query: ")
				console.log(err);
				callback(err, null);
			}

			// Giving results to callback
			callback(null, result.rows);
		});
	});
}

function getWeeklyUpdate(request, response) {
	// Using a helper function to query DB and provide callback after processing
	getWeeklyUpdateFromDb(request.session.user, function(error, result) {
		// Callback function that will be called when the DB done
		if (error || result == null) {
			response.status(500).json({success: false, data: error});
		} else {
			console.log("Received results from database: " + result);
			response.json(result);
		}
	});
}

function getWeeklyUpdateFromDb(userId, callback) {
	console.log("Getting weekly update from DB...");

	var client = new pg.Client(connectionString);

	client.connect(function(err) {
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
			callback(err, null);
		}

		var sql =  "SELECT total_work_time_day, total_available_time_day " +
				   "FROM day "                                             +
				   "WHERE planner_id = "                                   + 
				   userId;

		var query = client.query(sql, function(err, result) {
			// Done getting data from DB; disconnect the client
			client.end(function(err) {
				if (err) throw err;
			});

			if (err) {
				console.log("Error in query: ")
				console.log(err);
				callback(err, null);
			}

			// Giving results to callback
			callback(null, result.rows);
		});
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
				console.log("dayId:" + dayId);
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
	console.log("Getting days from DB");

	var client = new pg.Client(connectionString);

	client.connect(function(err) {
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
			callback(err, null);
		}

		var sql =  "SELECT "                                                                        +
					"* " +
		                // "td.task_day_id, td.task_id, td.day_id, td.planner_id, t.task_id, t.class, t.description," +
		                // "t.due_time, t.total_work_time, d.day_id, d.name, d.total_work_time_day,"   +
		                // "d.total_available_time_day "                                               +
		           	// "FROM task_day as td "                                                          +
		           	"FROM (select * from task_day as td inner join task as t on td.task_id = t.task_id) as t2 "    +
					// "INNER JOIN task as t "                                                         +
					// 	"ON td.task_id = t.task_id "                                                +
					// "RIGHT JOIN day as d "                                                          +
					"RIGHT JOIN (select * from day where planner_id = " + userId + ") as d "  +
						" ON t2.day_id = d.day_id "                                                  +
					// "WHERE td.planner_id = " + userId +
                    "ORDER BY t2.due_time ASC";

		var query = client.query(sql, function(err, result) {
			// Done getting data from DB; disconnect the client
			client.end(function(err) {
				if (err) throw err;
			});

			if (err) {
				console.log("Error in query: ")
				console.log(err);
				callback(err, null);
			}
			console.log("TEST FOR RESULT: " + JSON.stringify(result.rows))
			// Giving results to callback
			callback(null, result.rows);
		});
	});
}

function createNewTask(req, res) {
	insertNewTaskIntoDb(function (error, result) {
		console.log("Inserting new task_day value into DB...");

		var client = new pg.Client(connectionString);

		client.connect(function(err) {
			if (err) {
				console.log("Error connecting to DB: ")
				console.log(err);
			}

			var dayId = (parseInt(req.session.user) - 1) * 7 + parseInt(result.last_day_id);

			var sql = "INSERT INTO task_day" 		+
						"("							+
						    "task_id"		        +
						  ", day_id"				+
						  ", planner_id"			+
						") "						+
						"VALUES"					+
						"("							+ 
							result.last_task_id 	+ 
							"," + dayId	            + 
							"," + req.session.user	+ 
						")";
			
			var sqlUpdate = "UPDATE day "                                      +
			                "SET total_work_time_day = total_work_time_day + " + 
							result.work_time                                   + 
							" WHERE day_id = "                                 + 
							dayId;
					
			sql += ";" + sqlUpdate;

			var query = client.query(sql, function(err, result) {
				// Done getting data from DB; disconnect the client
				client.end(function(err) {
					if (err) throw err;
					getDaysAndTasks(req, res);
				});
			});
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

	var client = new pg.Client(connectionString);

	client.connect(function(err) {
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
			callback(err, null);
		}

		var sql = "INSERT INTO task"           +
                  "("                          +
                      "class"                  +
				   ", description"             +
				   ", due_time"                +
				   ", total_work_time"         +
				   ") "                        +
				   "VALUES"                    +
				   "("                         + 
				   "'" + course      + "'"     + 
				   ", '" + description + "'"   + 
				   ", '" + due         + "'"   + 
				   ", "  + work_time           + 
				   ") "                        +
				   "RETURNING task_id";

		var query = client.query(sql, function(err, result) {
			// Done getting data from DB; disconnect the client
			
			client.end(function(err) {
				if (err) throw err;
			});

			callback(null, {
				last_task_id: result.rows[0].task_id,
				last_day_id: dayId,
				work_time: work_time
			});
		});
	});
	console.log("Inserted new task...");
}

function updateAvailableTime(request, response) {
	console.log("Updating day table...");

	var client = new pg.Client(connectionString);

	client.connect(function(err) {
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
		}

		var dayId = (parseInt(request.session.user) - 1) * 7 + parseInt(request.body.day_id);

		var sql = "UPDATE day SET total_available_time_day = " + 
                   request.body.available_time                 + 
                   " WHERE day_id = "                          + 
                   dayId;
                //    request.body.day_id;

		var query = client.query(sql, function(err, result) {
			// Done getting data from DB; disconnect the client
			client.end(function(err) {
				if (err) throw err;
				getDaysAndTasks(request, response);
			});
		});
	});
	console.log("Updated available time in day table...");			
}

function deleteTask(request, response) {	
	console.log("Deleting task #" + request.body.task_id);

	var client = new pg.Client(connectionString);

	client.connect(function(err) {
		if (err) {
			console.log("Error connecting to DB: ")
			console.log(err);
		}

		var sqlUpdate = "UPDATE day SET total_work_time_day = total_work_time_day - " + 
                        "(SELECT total_work_time FROM task WHERE task_id = "          +
                             request.body.task_id + ") "                              +
						" WHERE day_id = "                                            + 
                        "(SELECT day_id FROM task_day WHERE task_id = "               + 
                             request.body.task_id + ")";

		var sql = "DELETE FROM task_day WHERE task_id = " + request.body.task_id + 
		          ";" +
				  "DELETE FROM task     WHERE task_id = " + request.body.task_id;

		sqlUpdate += ";" + sql;

		var query = client.query(sqlUpdate, function(err, result) {
			// Done getting data from DB; disconnect the client
			client.end(function(err) {
				if (err) throw err;
				getDaysAndTasks(request, response);
			});
		});
	});
	console.log("Deleted task...");			
}