/**
 * Created by middleca on 9/22/15.
 */
var sql = require('mssql');
var when = require('when');
var pipeline = require('when/pipeline');

var settings = require("../settings.js");

var Database = function() {

};

Database.prototype = {
	_connection: null,

	connect: function() {
		try {
			if (this._connection) {
				return when.resolve(this._connection);
			}

			if (this._connectDfd) {
				return this._connectDfd;
			}


			var that = this;
			var dfd = when.defer();
			this._connectDfd = dfd.promise;

			sql.on('error', function(err) {
				console.error("sql error!? ", err);
			});

			var connection = new sql.Connection(settings.database_config, function(err) {
				if (err) {
					console.error("error setting up db connection ", err);
					dfd.reject(err);
				}
				else {
					that._connection = connection;

					that._connection.on('error', function(err) {
						console.error("sql conn error!? ", err);
					});
					dfd.resolve(that._connection);
				}

				that._connectDfd = null;
			});

			return dfd.promise;
		}
		catch(ex) {
			console.error("database connect exploded ", ex);
			return when.reject(ex);
		}
	},


	/**
	 * external interface, uses the existing connection and runs a query
	 * @param querySql
	 * @returns {*}
	 */
	query: function(querySql) {
		return pipeline([
			this.connect.bind(this),
			this._query.bind(this, querySql)
		]);
	},


	/**
	 * internal helper that takes a connection / sql query
	 * @param querySql
	 * @param conn
	 * @returns {defer.promise|*|Promise|promise|Handler.promise|when.promise}
	 * @private
	 */
	_query: function(querySql, conn) {
		var dfd = when.defer();
		var req = new sql.Request(conn);
		req.query(querySql, function(err, records) {
			if (err) {
				dfd.reject(err);
			}
			else {
				dfd.resolve(records);
			}
		});
		return dfd.promise;
	},

	_: null
};

module.exports = new Database();