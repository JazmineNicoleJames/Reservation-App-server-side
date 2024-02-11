/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const Customer = require("./customer");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  };

/*   numGuests getter & setter. */

  get numGuests(){
    return this._numGuests;
  };

  set numGuests(val){
    if(val < 1){
      throw new Error("Reservation must be for at least one(1) person.");
    }
    this._numGuests = val;
  };

  /* startAt getter & setter.*/

  get startAt(){
    return this._startAt;
  }

  set startAt(val){
    if(val instanceof Date && !isNaN(val)){
      this._startAt = val;
    } else {
      throw new Error("Must be a valid date.");
    }
  };

  /* customerId getter & setter. */

  get customerId(){
    return this._customerId;
  };

  set customerId(val){
    if(this._customerId && this._customerId !== val){
      throw new Error("Can't change customer ID.")
    } else{
      this._customerId = val;
    }

  }


  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

 /*  find top customers. */

 static async getTopCustomers(){
    const results = await db.query(
      `SELECT c.id AS customer_id,
      c.first_name,
      c.last_name,
      c.first_name || ' ' || c.last_name AS "fullName",
      COUNT(r.id) AS reservation_count
      FROM customers c
      JOIN reservations r on c.id = r.customer_id
      GROUP BY c.id, c.first_name, c.last_name
      ORDER BY reservation_count DESC
      LIMIT 10`
    );  

    return results.rows;
 }


  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations SET customer_id=$1, start_at=$2, num_guests=$3, notes=$4
             WHERE id=$5`,
        [this.customerId, this.startAt, this.numGuests, this.notes, this.id]
      );
    }
  }
}


module.exports = Reservation;
