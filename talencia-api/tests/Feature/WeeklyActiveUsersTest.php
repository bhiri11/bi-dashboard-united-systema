<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class WeeklyActiveUsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_the_default_week_and_supports_custom_periods(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-04 12:00:00'));

        User::factory()->create(['last_login' => Carbon::parse('2026-08-04 09:00:00')]);
        User::factory()->create(['last_login' => Carbon::parse('2026-08-03 09:00:00')]);
        User::factory()->create(['last_login' => Carbon::parse('2026-07-30 09:00:00')]);
        User::factory()->create(['last_login' => Carbon::parse('2026-07-27 09:00:00')]);
        User::factory()->create(['last_login' => Carbon::parse('2026-07-24 09:00:00')]);

        $defaultResponse = $this->getJson('/api/kpi/weekly-active-users');

        $defaultResponse
            ->assertOk()
            ->assertJsonPath('active_users', 3)
            ->assertJsonPath('previous_week_active_users', 2)
            ->assertJsonPath('growth_rate', 50)
            ->assertJsonCount(7, 'categories')
            ->assertJsonCount(7, 'series.0.data');

        $customResponse = $this->getJson('/api/kpi/weekly-active-users?days=14');

        $customResponse
            ->assertOk()
            ->assertJsonPath('active_users', 5)
            ->assertJsonPath('previous_week_active_users', 0)
            ->assertJsonPath('growth_rate', 100)
            ->assertJsonCount(14, 'categories')
            ->assertJsonCount(14, 'series.0.data')
            ->assertJsonPath('period_days', 14)
            ->assertJsonPath('period_label', 'Last 14 days');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }
}
