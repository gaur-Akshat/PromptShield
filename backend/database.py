"""
MySQL database connection and utility functions for PromptShield.
Handles connection pooling, error handling, and common database operations.
"""
import mysql.connector
from mysql.connector import Error, pooling
import os
from contextlib import contextmanager
from typing import Optional, Dict, Any, List, Tuple


# Database configuration - can be overridden by environment variables
DB_CONFIG = {
    "host": os.getenv("MYSQLHOST"),
    "port": int(os.getenv("MYSQLPORT", 3306)),
    "user": os.getenv("MYSQLUSER"),
    "password": os.getenv("MYSQLPASSWORD"),
    "database": os.getenv("MYSQLDATABASE"),
    "charset": "utf8mb4",
    "collation": "utf8mb4_unicode_ci",
    "autocommit": False
}

# Connection pool configuration
POOL_CONFIG = {
    'pool_name': 'promptshield_pool',
    'pool_size': 5,
    'pool_reset_session': True
}

# Global connection pool
_connection_pool: Optional[pooling.MySQLConnectionPool] = None


def initialize_pool():
    """
    Initialize MySQL connection pool.
    Should be called once at application startup.
    """
    global _connection_pool
    try:
        _connection_pool = pooling.MySQLConnectionPool(
            **POOL_CONFIG,
            **DB_CONFIG
        )
        print(f"✓ Connection pool initialized successfully")
    except Error as e:
        print(f"✗ Error creating connection pool: {e}")
        raise


def get_connection():
    """
    Get a connection from the pool.
    Returns a MySQL connection object.
    """
    if _connection_pool is None:
        initialize_pool()
    
    try:
        connection = _connection_pool.get_connection()
        return connection
    except Error as e:
        print(f"Error getting connection from pool: {e}")
        raise


@contextmanager
def get_db_connection():
    """
    Context manager for database connections.
    Automatically handles connection cleanup.
    
    Usage:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users")
            result = cursor.fetchall()
    """
    connection = None
    try:
        connection = get_connection()
        yield connection
        connection.commit()
    except Error as e:
        if connection:
            connection.rollback()
        print(f"Database error: {e}")
        raise
    finally:
        if connection and connection.is_connected():
            connection.close()


def execute_query(query: str, params: Optional[Tuple] = None, fetch: bool = True) -> Optional[List[Tuple]]:
    """
    Execute a SELECT query and return results.
    
    Args:
        query: SQL query string
        params: Query parameters (for parameterized queries)
        fetch: Whether to fetch results (True for SELECT, False for INSERT/UPDATE/DELETE)
    
    Returns:
        List of tuples containing query results, or None if fetch=False
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=False)
        try:
            cursor.execute(query, params or ())
            if fetch:
                return cursor.fetchall()
            return None
        finally:
            cursor.close()


def execute_one(query: str, params: Optional[Tuple] = None) -> Optional[Tuple]:
    """
    Execute a query and return a single row.
    
    Args:
        query: SQL query string
        params: Query parameters
    
    Returns:
        Single tuple row or None if no results
    """
    results = execute_query(query, params, fetch=True)
    return results[0] if results else None


def execute_update(query: str, params: Optional[Tuple] = None) -> int:
    """
    Execute an INSERT, UPDATE, or DELETE query.
    
    Args:
        query: SQL query string
        params: Query parameters
    
    Returns:
        Number of affected rows
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(query, params or ())
            return cursor.rowcount
        finally:
            cursor.close()


def execute_insert(query: str, params: Optional[Tuple] = None) -> int:
    """
    Execute an INSERT query and return the last insert ID.
    
    Args:
        query: SQL query string
        params: Query parameters
    
    Returns:
        Last insert ID
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(query, params or ())
            return cursor.lastrowid
        finally:
            cursor.close()


def create_tables():
    """
    Create necessary database tables if they don't exist.
    Should be called once during application setup.
    """
    create_users_table = """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(create_users_table)
            print("✓ Database tables created/verified successfully")
    except Error as e:
        print(f"✗ Error creating tables: {e}")
        raise


def test_connection() -> bool:
    """
    Test database connection.
    
    Returns:
        True if connection successful, False otherwise
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            return True
    except Error as e:
        print(f"Connection test failed: {e}")
        return False

