#!/bin/bash
# Script to verify which files still need disaggregation updates

echo "Files that need disaggregation (should contain 'SET SESSION sql_mode'):"
echo "================================================================"

cd /home/felix/projects/ampath/facility-client-tool/moh731

for file in *.sql; do
    if [ "$file" != "_DISAGGREGATION_TEMPLATE.sql" ]; then
        if ! grep -q "SET SESSION sql_mode" "$file"; then
            echo "❌ $file - NEEDS UPDATE"
        else
            echo "✅ $file - Already updated"
        fi
    fi
done

echo ""
echo "Summary:"
echo "--------"
total=$(ls -1 *.sql | grep -v "_DISAGGREGATION_TEMPLATE.sql" | wc -l)
updated=$(grep -l "SET SESSION sql_mode" *.sql | grep -v "_DISAGGREGATION_TEMPLATE.sql" | wc -l)
remaining=$((total - updated))

echo "Total files: $total"
echo "Updated: $updated"
echo "Remaining: $remaining"
