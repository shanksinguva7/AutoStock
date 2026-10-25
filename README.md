# AutoStock — Car Dealership Inventory System

## Overview

## Features

## Tech Stack

## Local Setup
### Backend
### Frontend

## Environment Variables

## Seeded Admin Login

## API Summary

## Assumptions

- Search (`GET /api/vehicles/search`): a blank or whitespace-only filter value (for example `?make=` or `?minPrice=%20`) is treated as if it was not sent, so it never filters on an empty string or turns into a price of 0. Text filters match case-insensitively anywhere in the field. On SQLite this case-insensitivity covers ASCII letters only (`koda` finds "Škoda", `škoda` does not).
- Update (`PUT /api/vehicles/:id`): PUT replaces the whole vehicle and sets `quantity` to the exact value sent, not a change relative to the current stock. If a purchase lands just before an admin's update, the update overwrites the decremented quantity. Use restock to add units safely.

## Screenshots

## Test Report

## My AI Usage
