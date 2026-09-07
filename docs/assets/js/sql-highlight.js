/* 极简 MySQL 语法高亮：给编辑器 overlay 与参考解展示使用。 */
(function () {
  "use strict";

  const KEYWORDS = new Set((
    "select from where group by order having limit offset join inner left right full outer cross on using "
    + "and or not in exists between like rlike regexp is null as distinct union all with recursive "
    + "case when then else end asc desc insert update delete create drop alter "
    + "interval year month week day hour minute second quarter current_date curdate now"
  ).toUpperCase().split(" ").filter(Boolean));

  const FUNCTIONS = new Set((
    "sum count avg min max round abs coalesce ifnull nullif if cast concat concat_ws group_concat "
    + "row_number rank dense_rank lag lead first_value last_value ntile over partition "
    + "date_format date_add date_sub datediff timestampdiff str_to_date extract "
    + "substring substring_index length lower upper trim json_table grouping"
  ).toUpperCase().split(" ").filter(Boolean));

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const TOKEN_RE = /(--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.|'')*')|("(?:[^"\\]|\\.)*")|(`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_$]*)/g;

  function highlight(src) {
    let out = "";
    let last = 0;
    let m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(src)) !== null) {
      out += escapeHtml(src.slice(last, m.index));
      const tok = m[0];
      const upper = tok.toUpperCase();
      if (m[1]) out += '<span class="tok-com">' + escapeHtml(tok) + "</span>";
      else if (m[2] || m[3]) out += '<span class="tok-str">' + escapeHtml(tok) + "</span>";
      else if (m[4]) out += '<span class="tok-str">' + escapeHtml(tok) + "</span>";
      else if (m[5]) out += '<span class="tok-num">' + escapeHtml(tok) + "</span>";
      else if (KEYWORDS.has(upper)) out += '<span class="tok-kw">' + escapeHtml(tok) + "</span>";
      else if (FUNCTIONS.has(upper)) out += '<span class="tok-fn">' + escapeHtml(tok) + "</span>";
      else out += escapeHtml(tok);
      last = TOKEN_RE.lastIndex;
    }
    out += escapeHtml(src.slice(last));
    return out + "\n";
  }

  window.SQLT = window.SQLT || {};
  window.SQLT.highlight = highlight;
  window.SQLT.escapeHtml = escapeHtml;
})();
