with open('app.js', encoding='utf-8') as f:
    js_code = f.read()

# Check parentheses / braces balance
stack = []
pairs = {')': '(', '}': '{', ']': '['}
in_string = False
str_char = ''
in_line_comment = False
in_block_comment = False
errors = []

for line_no, line in enumerate(js_code.splitlines(), start=1):
    i = 0
    while i < len(line):
        ch = line[i]
        if in_line_comment:
            break
        if in_block_comment:
            if ch == '*' and i + 1 < len(line) and line[i+1] == '/':
                in_block_comment = False
                i += 1
            i += 1
            continue
        if in_string:
            if ch == '\\':
                i += 1
            elif ch == str_char:
                in_string = False
            i += 1
            continue
        if ch == '/' and i + 1 < len(line):
            if line[i+1] == '/':
                break
            elif line[i+1] == '*':
                in_block_comment = True
                i += 1
                i += 1
                continue
        if ch in ('"', "'", '`'):
            in_string = True
            str_char = ch
            i += 1
            continue
        if ch in '({[':
            stack.append((ch, line_no))
        elif ch in ')}]':
            if not stack:
                errors.append(f"Unmatched closing '{ch}' at line {line_no}")
            else:
                top, top_line = stack.pop()
                if top != pairs[ch]:
                    errors.append(f"Mismatched '{ch}' at line {line_no}, expected match for '{top}' from line {top_line}")
        i += 1

if stack:
    for top, top_line in stack:
        errors.append(f"Unclosed '{top}' from line {top_line}")

print("Brace/parenthesis check:")
if errors:
    for e in errors[:10]:
        print(e)
else:
    print("All braces, brackets and quotes are balanced!")
