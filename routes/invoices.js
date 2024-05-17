const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();

const db = require("../db");

/** GET: Return all invoices */

router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT id,comp_code FROM invoices`);

        return res.json({invoices : results.rows});
    } catch (err) {
        return next(err);
    }
});

/** GET: Return invoice with matching id */

router.get("/:id", async (req, res, next) => {
    try{
        const { id } = req.params;

        const result = await db.query(
            `SELECT id,amt,paid,add_date,paid_date,code,name,description
            FROM invoices
            INNER JOIN companies
            ON invoices.comp_code = companies.code
            WHERE id=$1`,
            [id]);

            if (result.rows.length === 0) {
                throw new ExpressError(`Invoice not found`, 404);
            }

        return res.json({invoice : {id : result.rows[0].id,
                                    amt : result.rows[0].amt,
                                    paid : result.rows[0].paid,
                                    add_date : result.rows[0].add_date,
                                    paid_date : result.rows[0].paid_date,
                                    company : {code : result.rows[0].code,
                                                name : result.rows[0].name,
                                                description : result.rows[0].description
                                    }
                        }});
    } catch (err) {
        return next(err);
    }
});

/** POST: Add invoice */

router.post("/", async (req, res, next) => {
    try{
        const { comp_code, amt } = req.body;

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to add invoice`, 400);
        }

        return res.status(201).json({invoice : result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

/** PUT: Edit invoice with matching id */

router.put("/:id", async (req, res, next) => {
    try{
        const { id } = req.params;
        const { amt, paid } = req.body;

        if (!paid) {
            const result = await db.query(
                `UPDATE invoices
                SET amt = $1, paid_date = null
                WHERE id = $2
                RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                [amt, id]
            );

            if (result.rows.length === 0) {
                throw new ExpressError(`Invoice not found`, 404);
            }

            return res.json({invoice : result.rows[0]});
        } else {
            const paid_before = await db.query(
                `SELECT paid
                FROM invoices
                WHERE id=$1`,
                [id]
            )
            if (paid_before) {
                const result = await db.query(
                    `UPDATE invoices
                    SET amt = $1
                    WHERE id = $2
                    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                    [amt, id]
                );
    
                if (result.rows.length === 0) {
                    throw new ExpressError(`Invoice not found`, 404);
                }
    
                return res.json({invoice : result.rows[0]});
            } else {
                const result = await db.query(
                    `UPDATE invoices
                    SET amt = $1, paid = true, paid_date = CURRENT_DATE
                    WHERE id = $2
                    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                    [amt, id]
                );
    
                if (result.rows.length === 0) {
                    throw new ExpressError(`Invoice not found`, 404);
                }
    
                return res.json({invoice : result.rows[0]});
            }
        }

    } catch (err) {
        return next(err);
    }
});

/** DELETE: Delete invoice with matching id */

router.delete("/:id", async (req, res, next) => {
    try{
        const { id } = req.params;

        const result = await db.query(
            `DELETE FROM invoices
            WHERE id = $1
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice not found`, 404);
        }

        return res.json({message : "Deleted"});
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
