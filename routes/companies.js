const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();

const slugify = require("slugify");

const db = require("../db");

/** GET: Return all comapnies */

router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT code,name FROM companies`);

        return res.json({companies : results.rows});
    } catch (err) {
        return next(err);
    }
});

/** GET: Return company with matching code */

router.get("/:code", async (req, res, next) => {
    try{
        const results = await db.query(
            `SELECT code,name,description,industry
            FROM companies
            LEFT JOIN companies-industries
            ON companies.code = companies-industries.comp_code
            LEFT JOIN industries
            ON companies-industries.industries_code = industries.code
            WHERE companies.code=$1`,
            [req.params.code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Company not found`, 404);
        }

        const { code, name, description } = results.rows[0];
        const industries = results.rows.map(row => row.industry);

        return res.json({company : {code, name, description, industries}});
    } catch (err) {
        return next(err);
    }
});

/** POST: Add company */

router.post("/", async (req, res, next) => {
    try{
        const { code, name, description } = req.body;

        const result = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES($1, $2, $3)
            RETURNING code, name, description`,
            [slugify(code, {
                replacement: '-',
                lower: true,
                strict: true,
            }), name, description]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to add company`, 400);
        }

        return res.status(201).json({company : result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

/** PUT: Edit company with matching code */

router.put("/:code", async (req, res, next) => {
    try{
        const { code } = req.params;
        const { name, description } = req.body;

        const result = await db.query(
            `UPDATE companies
            SET name=$1, description=$2
            WHERE code = $3
            RETURNING code, name, description`,
            [name, description, code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Company not found`, 404);
        }

        return res.json({company : result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

/** DELETE: Delete company with matching code */

router.delete("/:code", async (req, res, next) => {
    try{
        const { code } = req.params;

        const result = await db.query(
            `DELETE FROM companies
            WHERE code = $1
            RETURNING code, name, description`,
            [code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Company not found`, 404);
        }

        return res.json({message : "Deleted"});
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
