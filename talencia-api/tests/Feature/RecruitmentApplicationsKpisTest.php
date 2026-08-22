<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RecruitmentApplicationsKpisTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('professions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->timestamps();
        });

        Schema::create('project_jobs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('accepted_candidates')->default(0);
            $table->unsignedInteger('available_posts')->default(0);
            $table->foreignId('professions_id')->nullable();
            $table->timestamps();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->string('status');
        });
    }

    public function test_it_returns_the_recruitment_kpis_in_order(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-06 12:00:00'));

        DB::table('professions')->insert([
            ['id' => 1, 'name' => 'Model', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Host', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('project_jobs')->insert([
            ['id' => 1, 'accepted_candidates' => 0, 'available_posts' => 2, 'professions_id' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'accepted_candidates' => 1, 'available_posts' => 1, 'professions_id' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'accepted_candidates' => 2, 'available_posts' => 3, 'professions_id' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'accepted_candidates' => 0, 'available_posts' => 2, 'professions_id' => 2, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('applications')->insert([
            ['job_id' => 1, 'created_at' => '2026-08-06 08:00:00', 'updated_at' => '2026-08-06 10:00:00', 'status' => 'accepted'],
            ['job_id' => 1, 'created_at' => '2026-08-06 07:00:00', 'updated_at' => '2026-08-06 11:00:00', 'status' => 'accepted'],
            ['job_id' => 2, 'created_at' => '2026-08-05 06:00:00', 'updated_at' => '2026-08-05 12:00:00', 'status' => 'accepted'],
            ['job_id' => 3, 'created_at' => '2026-08-04 05:00:00', 'updated_at' => '2026-08-04 13:00:00', 'status' => 'withdrawn'],
            ['job_id' => 4, 'created_at' => '2026-08-03 04:00:00', 'updated_at' => '2026-08-03 14:00:00', 'status' => 'declined'],
        ]);

        $response = $this->getJson('/api/kpi/recruitment-applications');

        $response
            ->assertOk()
            ->assertJsonPath('group', 'recruitment_applications')
            ->assertJsonPath('items.0.metric', 'application_conversion_rate')
            ->assertJsonPath('items.0.value', 60)
            ->assertJsonPath('items.1.metric', 'average_processing_time')
            ->assertJsonPath('items.1.unit', 'days')
            ->assertJsonPath('items.1.value', 0.25)
            ->assertJsonPath('items.2.metric', 'position_fill_rate')
            ->assertJsonPath('items.2.value', 50)
            ->assertJsonPath('items.3.metric', 'applications_by_profession')
            ->assertJsonPath('items.3.items.0.profession_name', 'Model')
            ->assertJsonPath('items.3.items.0.applications_count', 3)
            ->assertJsonPath('items.4.metric', 'withdrawal_rate')
            ->assertJsonPath('items.4.value', 20);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }
}
