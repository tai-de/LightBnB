const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  const query = {
    text: `SELECT * FROM users WHERE email = $1;`,
    values: [email],
  };

  return pool.query(query)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return Promise.reject(err.message);
    });

};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  const query = {
    text: `SELECT * FROM users WHERE id = $1;`,
    values: [id],
  };

  return pool.query(query)
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });

};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {

  const existingCheck = {
    text: `SELECT COUNT(*) FROM users WHERE email = $1;`,
    values: [user.email],
  };

  const query = {
    text: `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`,
    values: [user.name, user.email, user.password],
  };

  return pool
    .query(existingCheck)
    .then((result) => {
      if (result.rows[0].count > 0) {
        console.log('user exists');
        // return Promise.reject({});
        return {};
      }
      return pool
        .query(query)
        .then((result) => {
          console.log('working');
          return result.rows[0];
        });
      
    });

};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {


  const query = {
    text: `SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date, AVG(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties ON properties.id = reservations.property_id
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    FETCH FIRST $2 ROWS ONLY;`,
    values: [guest_id, limit],
  };

  return pool.query(query)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });

};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  const query = {
    text: `SELECT * FROM properties FETCH FIRST $1 ROWS ONLY;`,
    values: [limit],
  };

  return pool.query(query)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });

};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
