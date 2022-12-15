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
        return {};
      }
      return pool
        .query(query)
        .then((result) => {
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
    text: `SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating
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
    text: `SELECT properties.*, AVG(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON property_reviews.property_id = properties.id
    `,
    values: [],
  };

  if (options.city) {
    query.values.push(`%${options.city}%`);
    query.text += `WHERE city LIKE $${query.values.length} `;
  }

  if (options.owner_id) {
    query.values.push(options.owner_id);
    if (query.text.includes('WHERE')) {
      query.text += ` AND `;
    } else { query.text += `WHERE `; }
    query.text += `properties.owner_id = $${query.values.length} `;
  }

  if (options.minimum_price_per_night || options.maximum_price_per_night) {
    query.values.push(options.minimum_price_per_night || 0);
    query.values.push(options.maximum_price_per_night || 2147483647);
    if (query.text.includes('WHERE')) {
      query.text += ` AND `;
    } else { query.text += ` WHERE `; }
    query.text += `properties.cost_per_night BETWEEN $${query.values.length - 1} AND $${query.values.length} `;
  }

  query.text += `GROUP BY properties.id `;

  if (options.minimum_rating) {
    query.values.push(options.minimum_rating);
    query.text += `
    HAVING AVG(property_reviews.rating) >= $${query.values.length}
    `;
  }

  query.values.push(limit);
  query.text += `
    ORDER BY properties.cost_per_night
    FETCH FIRST $${query.values.length} ROWS ONLY;
    `;

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

  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  } = property;


  const query = {
    text: `
      INSERT INTO properties (
        owner_id,
        title,
        description,
        thumbnail_photo_url,
        cover_photo_url,
        cost_per_night,
        parking_spaces,
        number_of_bathrooms,
        number_of_bedrooms,
        country,
        street,
        city,
        province,
        post_code,
        active
      )
      VALUES
        ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14 )
      RETURNING *;`,
    values: [
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms,
      country,
      street,
      city,
      province,
      post_code
    ],
  };

  return pool.query(query)
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });

};
exports.addProperty = addProperty;
