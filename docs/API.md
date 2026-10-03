# Calculator API

The project exposes a small public calculation API so other open-source tools can reuse the same unit-economics formulas.

## Endpoint

`/api/calculate`

The endpoint supports both GET query parameters and POST JSON.

## POST example

```bash
curl -X POST https://global-ecommerce-toolkit.vercel.app/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "sellingPrice": 59.99,
    "productCost": 14,
    "shipping": 5,
    "adCost": 18,
    "fees": 3,
    "taxes": 0
  }'
```

## GET example

```
/api/calculate?sellingPrice=59.99&productCost=14&shipping=5&adCost=18&fees=3&taxes=0
```

## Response

The response includes:

- non-ad costs
- contribution profit per order
- contribution margin
- break-even CPA
- break-even ROAS
- current ROAS

Negative or non-numeric inputs are normalized to zero. The API is intended for operational estimates, not tax or accounting advice.
