<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DiagnoseSchemaSeeder extends Seeder
{
    public function run(): void
    {
        $tables = [
            'applications', 'project_jobs', 'professions', 'projects', 'companies',
            'attendances', 'todos', 'tasks', 'user_ratings', 'ratings',
            'penalties', 'user_penalties', 'shifts', 'gallery',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $columns = Schema::getColumnListing($table);
                $count = DB::table($table)->count();
                echo "=== {$table} (count: {$count}) ===\n";
                echo implode(', ', $columns) . "\n\n";
            } else {
                echo "=== {$table} === TABLE DOES NOT EXIST\n\n";
            }
        }
    }
}
