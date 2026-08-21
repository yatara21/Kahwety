param(
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        [object]$Body
    )

    $params = @{
        Uri = $Url
        Method = $Method
        UseBasicParsing = $true
    }

    if ($Headers) {
        $params.Headers = $Headers
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 8)
    }

    try {
        $response = Invoke-WebRequest @params
        return [PSCustomObject]@{
            Status = [int]$response.StatusCode
            Body = $response.Content
        }
    }
    catch {
        $statusCode = 0
        $body = ""

        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Close()
            }
        }

        return [PSCustomObject]@{
            Status = $statusCode
            Body = $body
        }
    }
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$password = "TestPass123!"

$ownerEmail = "ownerx.$ts@example.com"
$customerEmail = "custx.$ts@example.com"

$ownerReg = Invoke-Api -Method "POST" -Url "$BaseUrl/api/v1/auth/register/cafe-owner" -Body @{
    full_name = "Owner X"
    email = $ownerEmail
    password = $password
}

$customerReg = Invoke-Api -Method "POST" -Url "$BaseUrl/api/v1/auth/register/customer" -Body @{
    full_name = "Customer X"
    email = $customerEmail
    password = $password
}

$ownerAccess = (ConvertFrom-Json $ownerReg.Body).data.access_token
$ownerRefresh = (ConvertFrom-Json $ownerReg.Body).data.refresh_token
$customerAccess = (ConvertFrom-Json $customerReg.Body).data.access_token
$customerRefresh = (ConvertFrom-Json $customerReg.Body).data.refresh_token

$ownerHeaders = @{ Authorization = "Bearer $ownerAccess" }
$customerHeaders = @{ Authorization = "Bearer $customerAccess" }

$ownerMe = Invoke-Api -Method "GET" -Url "$BaseUrl/api/v1/auth/me" -Headers $ownerHeaders
$customerMe = Invoke-Api -Method "GET" -Url "$BaseUrl/api/v1/auth/me" -Headers $customerHeaders

$ownerId = (ConvertFrom-Json $ownerMe.Body).data.id
$customerId = (ConvertFrom-Json $customerMe.Body).data.id

$cafeCreate = Invoke-Api -Method "POST" -Url "$BaseUrl/api/v1/cafes" -Headers $ownerHeaders -Body @{
    name = "Cafe X $ts"
    description = "Cafe for complaint smoke"
    address = "Complaint St 10"
}

$cafeId = (ConvertFrom-Json $cafeCreate.Body).data.id

$complaintCreate = Invoke-Api -Method "POST" -Url "$BaseUrl/api/v1/complaints" -Headers $customerHeaders -Body @{
    subject = "Late order"
    description = "Order arrived late"
    customer_id = $customerId
    cafe_id = $cafeId
}

$complaintId = (ConvertFrom-Json $complaintCreate.Body).data.id

$customerComplaintList = Invoke-Api -Method "GET" -Url "$BaseUrl/api/v1/complaints/customer/$customerId" -Headers $customerHeaders
$ownerCafeComplaintList = Invoke-Api -Method "GET" -Url "$BaseUrl/api/v1/complaints/cafe/$cafeId" -Headers $ownerHeaders
$customerComplaintDetail = Invoke-Api -Method "GET" -Url "$BaseUrl/api/v1/complaints/$complaintId" -Headers $customerHeaders
$ownerComplaintDetail = Invoke-Api -Method "GET" -Url "$BaseUrl/api/v1/complaints/$complaintId" -Headers $ownerHeaders

$refreshBeforeLogout = Invoke-Api -Method "POST" -Url "$BaseUrl/api/v1/auth/refresh" -Body @{ refresh_token = $customerRefresh }
$logout = Invoke-Api -Method "POST" -Url "$BaseUrl/api/v1/auth/logout" -Body @{ refresh_token = $customerRefresh }
$refreshAfterLogout = Invoke-Api -Method "POST" -Url "$BaseUrl/api/v1/auth/refresh" -Body @{ refresh_token = $customerRefresh }

$checks = @(
    [PSCustomObject]@{ Check = "register_owner"; Status = $ownerReg.Status; Expect = "200"; Pass = ($ownerReg.Status -eq 200) },
    [PSCustomObject]@{ Check = "register_customer"; Status = $customerReg.Status; Expect = "200"; Pass = ($customerReg.Status -eq 200) },
    [PSCustomObject]@{ Check = "owner_me"; Status = $ownerMe.Status; Expect = "200"; Pass = ($ownerMe.Status -eq 200) },
    [PSCustomObject]@{ Check = "customer_me"; Status = $customerMe.Status; Expect = "200"; Pass = ($customerMe.Status -eq 200) },
    [PSCustomObject]@{ Check = "owner_create_cafe"; Status = $cafeCreate.Status; Expect = "200"; Pass = ($cafeCreate.Status -eq 200) },
    [PSCustomObject]@{ Check = "customer_create_complaint"; Status = $complaintCreate.Status; Expect = "200"; Pass = ($complaintCreate.Status -eq 200) },
    [PSCustomObject]@{ Check = "customer_list_own_complaints"; Status = $customerComplaintList.Status; Expect = "200"; Pass = ($customerComplaintList.Status -eq 200) },
    [PSCustomObject]@{ Check = "owner_list_cafe_complaints"; Status = $ownerCafeComplaintList.Status; Expect = "200"; Pass = ($ownerCafeComplaintList.Status -eq 200) },
    [PSCustomObject]@{ Check = "customer_get_complaint_detail"; Status = $customerComplaintDetail.Status; Expect = "200"; Pass = ($customerComplaintDetail.Status -eq 200) },
    [PSCustomObject]@{ Check = "owner_get_complaint_detail"; Status = $ownerComplaintDetail.Status; Expect = "200"; Pass = ($ownerComplaintDetail.Status -eq 200) },
    [PSCustomObject]@{ Check = "refresh_before_logout"; Status = $refreshBeforeLogout.Status; Expect = "200"; Pass = ($refreshBeforeLogout.Status -eq 200) },
    [PSCustomObject]@{ Check = "logout"; Status = $logout.Status; Expect = "200"; Pass = ($logout.Status -eq 200) },
    [PSCustomObject]@{ Check = "refresh_after_logout_denied"; Status = $refreshAfterLogout.Status; Expect = "401"; Pass = ($refreshAfterLogout.Status -eq 401) }
)

$result = [PSCustomObject]@{
    Passed = ($checks | Where-Object { $_.Pass }).Count
    Total = $checks.Count
    Checks = $checks
    Details = [PSCustomObject]@{
        OwnerEmail = $ownerEmail
        CustomerEmail = $customerEmail
        CafeId = $cafeId
        ComplaintId = $complaintId
        RefreshAfterLogoutBody = $refreshAfterLogout.Body
    }
}

$result | ConvertTo-Json -Depth 8
