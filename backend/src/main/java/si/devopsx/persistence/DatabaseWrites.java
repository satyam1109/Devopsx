package si.devopsx.persistence;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Keeps parameterized writes compatible with the local H2 and hosted Postgres stores. */
@Component
public class DatabaseWrites {
  public enum Table {
    CONTENT("content_items", "id", "payload"),
    COMPLETIONS("completions", "lesson_id", "completed_at"),
    REVIEWS("reviews", "card_id", "rating", "repetitions", "due_at"),
    PREFERENCES("preferences", "id", "payload");

    final String name;
    final List<String> columns;
    Table(String name, String... columns) {
      this.name = name;
      this.columns = List.of(columns);
    }
  }

  private final JdbcTemplate db;
  private final boolean postgres;

  public DatabaseWrites(JdbcTemplate db, DataSource dataSource) throws java.sql.SQLException {
    this.db = db;
    try (var connection = dataSource.getConnection()) {
      postgres = "PostgreSQL".equals(connection.getMetaData().getDatabaseProductName());
    }
  }

  public void upsert(Table table, Object... values) {
    if (values.length != table.columns.size()) throw new IllegalArgumentException("Invalid column count");
    String columns = String.join(",", table.columns);
    String placeholders = table.columns.stream().map(x -> "?").collect(Collectors.joining(","));
    String sql;
    if (postgres) {
      String updates = table.columns.stream().skip(1)
          .map(column -> column + "=EXCLUDED." + column).collect(Collectors.joining(","));
      sql = "INSERT INTO " + table.name + " (" + columns + ") VALUES (" + placeholders
          + ") ON CONFLICT (" + table.columns.getFirst() + ") DO UPDATE SET " + updates;
    } else {
      sql = "MERGE INTO " + table.name + " (" + columns + ") KEY(" + table.columns.getFirst()
          + ") VALUES (" + placeholders + ")";
    }
    db.update(sql, values);
  }
}
