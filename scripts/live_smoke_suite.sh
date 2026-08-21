#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
PASSWORD="TestPass123!"
TS="$(date +%s)"

OWNER_EMAIL="ownerx.${TS}@example.com"
CUSTOMER_EMAIL="custx.${TS}@example.com"

json_get() {
  local path="$1"
  local raw
  raw="$(cat)"
  JSON_GET_RAW="$raw" python - "$path" <<'PY'
import json
import os
import sys

path = sys.argv[1]
raw = os.environ.get("JSON_GET_RAW", "").strip()
if not raw:
    print("")
    raise SystemExit(0)

try:
    data = json.loads(raw)
except Exception:
    print("")
    raise SystemExit(0)

value = data
for part in path.split('.'):
    if isinstance(value, dict) and part in value:
        value = value[part]
    else:
        print("")
        raise SystemExit(0)

if value is None:
    print("")
elif isinstance(value, (dict, list)):
    print(json.dumps(value, separators=(',', ':')))
else:
    print(str(value))
PY
}

api_request() {
  local method="$1"
  local url="$2"
  local token="${3:-}"
  local body="${4:-}"

  local auth_args=()
  if [[ -n "$token" ]]; then
    auth_args=(-H "Authorization: Bearer ${token}")
  fi

  local content_args=()
  if [[ -n "$body" ]]; then
    content_args=(-H "Content-Type: application/json" --data "$body")
  fi

  local response
  response="$(curl -L -sS -X "$method" "$url" "${auth_args[@]}" "${content_args[@]}" -w $'\n%{http_code}')"

  local status body_out
  status="${response##*$'\n'}"
  body_out="${response%$'\n'*}"

  printf '%s\n%s\n' "$status" "$body_out"
}

status_of() {
  printf '%s' "$1" | sed -n '1p'
}

body_of() {
  printf '%s' "$1" | sed -n '2,$p'
}

add_check() {
  local name="$1"
  local status="$2"
  local expect="$3"
  local pass="$4"
  CHECK_LINES+=("${name}|${status}|${expect}|${pass}")
}

CHECK_LINES=()

# Register owner/customer
owner_payload="$(cat <<JSON
{"full_name":"Owner X","email":"${OWNER_EMAIL}","password":"${PASSWORD}"}
JSON
)"
customer_payload="$(cat <<JSON
{"full_name":"Customer X","email":"${CUSTOMER_EMAIL}","password":"${PASSWORD}"}
JSON
)"

owner_reg="$(api_request POST "${BASE_URL}/api/v1/auth/register/cafe-owner" "" "$owner_payload")"
customer_reg="$(api_request POST "${BASE_URL}/api/v1/auth/register/customer" "" "$customer_payload")"

owner_reg_status="$(status_of "$owner_reg")"
customer_reg_status="$(status_of "$customer_reg")"
owner_reg_body="$(body_of "$owner_reg")"
customer_reg_body="$(body_of "$customer_reg")"

owner_access="$(printf '%s' "$owner_reg_body" | json_get data.access_token)"
owner_refresh="$(printf '%s' "$owner_reg_body" | json_get data.refresh_token)"
customer_access="$(printf '%s' "$customer_reg_body" | json_get data.access_token)"
customer_refresh="$(printf '%s' "$customer_reg_body" | json_get data.refresh_token)"

add_check "register_owner" "$owner_reg_status" "200" "$([[ "$owner_reg_status" == "200" ]] && echo true || echo false)"
add_check "register_customer" "$customer_reg_status" "200" "$([[ "$customer_reg_status" == "200" ]] && echo true || echo false)"

# auth/me
owner_me="$(api_request GET "${BASE_URL}/api/v1/auth/me" "$owner_access" "")"
customer_me="$(api_request GET "${BASE_URL}/api/v1/auth/me" "$customer_access" "")"
owner_me_status="$(status_of "$owner_me")"
customer_me_status="$(status_of "$customer_me")"

add_check "owner_me" "$owner_me_status" "200" "$([[ "$owner_me_status" == "200" ]] && echo true || echo false)"
add_check "customer_me" "$customer_me_status" "200" "$([[ "$customer_me_status" == "200" ]] && echo true || echo false)"

owner_id="$(body_of "$owner_me" | json_get data.id)"
customer_id="$(body_of "$customer_me" | json_get data.id)"

# owner creates cafe
cafe_payload="$(cat <<JSON
{"name":"Cafe X ${TS}","description":"Cafe for complaint smoke","address":"Complaint St 10"}
JSON
)"
cafe_create="$(api_request POST "${BASE_URL}/api/v1/cafes" "$owner_access" "$cafe_payload")"
cafe_create_status="$(status_of "$cafe_create")"
cafe_create_body="$(body_of "$cafe_create")"
cafe_id="$(printf '%s' "$cafe_create_body" | json_get data.id)"
add_check "owner_create_cafe" "$cafe_create_status" "200" "$([[ "$cafe_create_status" == "200" ]] && echo true || echo false)"

# customer complaint flow
complaint_payload="$(cat <<JSON
{"subject":"Late order","description":"Order arrived late","customer_id":"${customer_id}","cafe_id":"${cafe_id}"}
JSON
)"
complaint_create="$(api_request POST "${BASE_URL}/api/v1/complaints" "$customer_access" "$complaint_payload")"
complaint_create_status="$(status_of "$complaint_create")"
complaint_create_body="$(body_of "$complaint_create")"
complaint_id="$(printf '%s' "$complaint_create_body" | json_get data.id)"
add_check "customer_create_complaint" "$complaint_create_status" "200" "$([[ "$complaint_create_status" == "200" ]] && echo true || echo false)"

customer_complaints="$(api_request GET "${BASE_URL}/api/v1/complaints/customer/${customer_id}" "$customer_access" "")"
owner_cafe_complaints="$(api_request GET "${BASE_URL}/api/v1/complaints/cafe/${cafe_id}" "$owner_access" "")"
customer_detail="$(api_request GET "${BASE_URL}/api/v1/complaints/${complaint_id}" "$customer_access" "")"
owner_detail="$(api_request GET "${BASE_URL}/api/v1/complaints/${complaint_id}" "$owner_access" "")"

customer_complaints_status="$(status_of "$customer_complaints")"
owner_cafe_complaints_status="$(status_of "$owner_cafe_complaints")"
customer_detail_status="$(status_of "$customer_detail")"
owner_detail_status="$(status_of "$owner_detail")"

add_check "customer_list_own_complaints" "$customer_complaints_status" "200" "$([[ "$customer_complaints_status" == "200" ]] && echo true || echo false)"
add_check "owner_list_cafe_complaints" "$owner_cafe_complaints_status" "200" "$([[ "$owner_cafe_complaints_status" == "200" ]] && echo true || echo false)"
add_check "customer_get_complaint_detail" "$customer_detail_status" "200" "$([[ "$customer_detail_status" == "200" ]] && echo true || echo false)"
add_check "owner_get_complaint_detail" "$owner_detail_status" "200" "$([[ "$owner_detail_status" == "200" ]] && echo true || echo false)"

# token lifecycle
refresh_before="$(api_request POST "${BASE_URL}/api/v1/auth/refresh" "" "{\"refresh_token\":\"${customer_refresh}\"}")"
logout_resp="$(api_request POST "${BASE_URL}/api/v1/auth/logout" "" "{\"refresh_token\":\"${customer_refresh}\"}")"
refresh_after="$(api_request POST "${BASE_URL}/api/v1/auth/refresh" "" "{\"refresh_token\":\"${customer_refresh}\"}")"

refresh_before_status="$(status_of "$refresh_before")"
logout_status="$(status_of "$logout_resp")"
refresh_after_status="$(status_of "$refresh_after")"

add_check "refresh_before_logout" "$refresh_before_status" "200" "$([[ "$refresh_before_status" == "200" ]] && echo true || echo false)"
add_check "logout" "$logout_status" "200" "$([[ "$logout_status" == "200" ]] && echo true || echo false)"
add_check "refresh_after_logout_denied" "$refresh_after_status" "401" "$([[ "$refresh_after_status" == "401" ]] && echo true || echo false)"

# admin-only checks (negative): non-admin roles should be forbidden
owner_admins_list="$(api_request GET "${BASE_URL}/api/v1/admins" "$owner_access" "")"
customer_admins_list="$(api_request GET "${BASE_URL}/api/v1/admins" "$customer_access" "")"
owner_admins_create="$(api_request POST "${BASE_URL}/api/v1/admins" "$owner_access" "{\"full_name\":\"Bad Admin\",\"email\":\"badadmin.${TS}@example.com\",\"password\":\"${PASSWORD}\"}")"

owner_admins_list_status="$(status_of "$owner_admins_list")"
customer_admins_list_status="$(status_of "$customer_admins_list")"
owner_admins_create_status="$(status_of "$owner_admins_create")"

owner_admins_list_pass=false
if [[ "$owner_admins_list_status" == "401" || "$owner_admins_list_status" == "403" ]]; then
  owner_admins_list_pass=true
fi

customer_admins_list_pass=false
if [[ "$customer_admins_list_status" == "401" || "$customer_admins_list_status" == "403" ]]; then
  customer_admins_list_pass=true
fi

owner_admins_create_pass=false
if [[ "$owner_admins_create_status" == "401" || "$owner_admins_create_status" == "403" ]]; then
  owner_admins_create_pass=true
fi

add_check "owner_admins_list_forbidden" "$owner_admins_list_status" "401/403" "$owner_admins_list_pass"
add_check "customer_admins_list_forbidden" "$customer_admins_list_status" "401/403" "$customer_admins_list_pass"
add_check "owner_admins_create_forbidden" "$owner_admins_create_status" "401/403" "$owner_admins_create_pass"

passed=0
total=0
for line in "${CHECK_LINES[@]}"; do
  total=$((total + 1))
  IFS='|' read -r _ _ _ pass <<< "$line"
  if [[ "$pass" == "true" ]]; then
    passed=$((passed + 1))
  fi
done

printf '{\n'
printf '  "passed": %d,\n' "$passed"
printf '  "total": %d,\n' "$total"
printf '  "checks": [\n'

for i in "${!CHECK_LINES[@]}"; do
  IFS='|' read -r name status expect pass <<< "${CHECK_LINES[$i]}"
  comma=','
  if [[ "$i" -eq $((${#CHECK_LINES[@]} - 1)) ]]; then
    comma=''
  fi
  printf '    {"check":"%s","status":%s,"expect":"%s","pass":%s}%s\n' "$name" "$status" "$expect" "$pass" "$comma"
done

refresh_after_body="$(body_of "$refresh_after")"
printf '  ],\n'
printf '  "details": {\n'
printf '    "owner_email": "%s",\n' "$OWNER_EMAIL"
printf '    "customer_email": "%s",\n' "$CUSTOMER_EMAIL"
printf '    "owner_id": "%s",\n' "$owner_id"
printf '    "customer_id": "%s",\n' "$customer_id"
printf '    "cafe_id": "%s",\n' "$cafe_id"
printf '    "complaint_id": "%s",\n' "$complaint_id"
printf '    "refresh_after_logout_body": %s\n' "$(python - <<'PY'
import json
import sys
body = sys.stdin.read()
try:
    parsed = json.loads(body)
    print(json.dumps(parsed, separators=(',', ':')))
except Exception:
    print('""')
PY
<<< "$refresh_after_body")"
printf '  }\n'
printf '}\n'
