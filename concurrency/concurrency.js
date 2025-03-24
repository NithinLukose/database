import mysql from "mysql2/promise";
const pool = mysql.createPool({
  host: "localhost",
  user: "dbuser",
  password: "dbpassword",
  database: "library_managemnet",
});
const borrowBook = async (id, userId) => {
  try {
    const [book] = await pool.query("SELECT stock FROM books WHERE id = ?", [
      id,
    ]);
    if (book[0].stock > 0) {
      const [insertResult] = await pool.query(
        "INSERT INTO Borrowed_Books (book_id, borrower_id, return_date) VALUES (?, ?, null)",
        [id, userId]
      );
      const [updateResult] = await pool.query(
        "UPDATE books SET stock = stock - 1 WHERE id = ?",
        [id]
      );
      console.log("book[0].stock", book[0].stock);
      console.log("insertResult", insertResult);
      console.log("updateResult", updateResult);
    }
    return { status: "success" };
  } catch (err) {
    console.log(err);
    return { status: "fail" };
  }
};

const pessimisticLockingBorrowBook = async (id, userId) => {
  try {
    await pool.query("START TRANSACTION");
    // Lock the row for update
    const [book] = await pool.query(
      "SELECT stock FROM books WHERE id = ? FOR UPDATE",
      [id]
    );
    console.log(book[0].stock);
    if (book[0].stock > 0) {
      const [updateResult] = await pool.query(
        "UPDATE books SET stock = stock - 1 WHERE id = ?",
        [id]
      );
      if (updateResult.affectedRows === 0) {
        return { status: "fail", message: "Concurrency conflict" };
      }
      await pool.query(
        "INSERT INTO Borrowed_Books (book_id, borrower_id, return_date) VALUES (?, ?, null)",
        [id, userId]
      );
      await pool.query("COMMIT");
      return { status: "success" };
    } else {
      await pool.query("ROLLBACK");
      return { status: "fail", message: "Book out of stock" };
    }
  } catch (err) {
    console.log(err);
    await pool.query("ROLLBACK");
    return { status: "fail", message: "An error occurred" };
  }
};

const optimisticLockingBorrowBook = async (id, userId) => {
  try {
    const [book] = await pool.query(
      "SELECT stock, version FROM books WHERE id = ?",
      [id]
    );
    console.log(book[0].stock);
    if (book[0].stock > 0) {
      const [updateResult] = await pool.query(
        "UPDATE books SET stock = stock - 1, version = version + 1 WHERE id = ? AND version = ?",
        [id, book[0].version]
      );

      if (updateResult.affectedRows === 0) {
        // Version mismatch, retry or fail
        return { status: "fail", message: "Concurrency conflict" };
      }

      await pool.query(
        "INSERT INTO Borrowed_Books (book_id, borrower_id, return_date) VALUES (?, ?, null)",
        [id, userId]
      );

      return { status: "success" };
    } else {
      return { status: "fail", message: "Book out of stock" };
    }
  } catch (err) {
    console.log(err);
    return { status: "fail", message: "An error occurred" };
  }
};

const testConcurrency = async () => {
  const id = 1; // Book ID
  const userIds = [1, 2, 3, 4, 5]; // User IDs

  const results = await Promise.all(
    userIds.map((userId) => optimisticLockingBorrowBook(id, userId))
  );

  console.log(results);
};

testConcurrency();
