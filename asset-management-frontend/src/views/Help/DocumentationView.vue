<template>
  <div class="help-page">
    <div class="help-page__intro">
      <h1 class="help-page__title">
        {{ $t('helpDocs.title') }}
      </h1>
      <p class="help-page__subtitle">
        {{ $t('helpDocs.subtitle') }}
      </p>
      <p class="help-page__lead">
        {{ $t('helpDocs.rolesLead') }}
      </p>
    </div>

    <el-tabs
      v-model="activeRole"
      class="help-role-tabs"
      type="border-card"
    >
      <el-tab-pane
        :label="$t('helpDocs.tabStaff')"
        name="staff"
      >
        <p class="tab-intro">
          {{ $t('helpDocs.staff.intro') }}
        </p>
        <el-collapse
          v-model="openStaff"
          class="help-collapse"
        >
          <el-collapse-item
            v-for="sec in staffSections"
            :key="sec.name"
            :title="$t(sec.titleKey)"
            :name="sec.name"
          >
            <div class="help-body">
              {{ $t(sec.bodyKey) }}
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>

      <el-tab-pane
        :label="$t('helpDocs.tabHead')"
        name="head"
      >
        <p class="tab-intro">
          {{ $t('helpDocs.head.intro') }}
        </p>
        <el-collapse
          v-model="openHead"
          class="help-collapse"
        >
          <el-collapse-item
            v-for="sec in headSections"
            :key="sec.name"
            :title="$t(sec.titleKey)"
            :name="sec.name"
          >
            <div class="help-body">
              {{ $t(sec.bodyKey) }}
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>

      <el-tab-pane
        :label="$t('helpDocs.tabDirector')"
        name="director"
      >
        <p class="tab-intro">
          {{ $t('helpDocs.director.intro') }}
        </p>
        <el-collapse
          v-model="openDirector"
          class="help-collapse"
        >
          <el-collapse-item
            v-for="sec in directorSections"
            :key="sec.name"
            :title="$t(sec.titleKey)"
            :name="sec.name"
          >
            <div class="help-body">
              {{ $t(sec.bodyKey) }}
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
    </el-tabs>

    <h2 class="help-page__overview-title">
      {{ $t('helpDocs.overviewTitle') }}
    </h2>
    <p class="help-page__overview-lead">
      {{ $t('helpDocs.overviewLead') }}
    </p>

    <el-row :gutter="20">
      <el-col
        v-for="(block, i) in blocks"
        :key="i"
        :xs="24"
        :md="12"
      >
        <el-card
          class="help-card"
          shadow="hover"
        >
          <template #header>
            <div class="help-card__head">
              <el-icon
                class="help-card__icon"
                :size="22"
              >
                <component :is="block.icon" />
              </el-icon>
              <span>{{ $t(block.titleKey) }}</span>
            </div>
          </template>
          <ul class="help-card__list">
            <li
              v-for="(lineKey, j) in block.lines"
              :key="j"
            >
              {{ $t(lineKey) }}
            </li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      class="help-page__tip"
      type="info"
      :closable="false"
      show-icon
    >
      {{ $t('helpDocs.tip') }}
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Box, Switch, List, DataAnalysis } from '@element-plus/icons-vue';

const activeRole = ref('staff');
const openStaff = ref(['s1', 's2', 's3']);
const openHead = ref(['h1', 'h2']);
const openDirector = ref(['d1', 'd2']);

const staffSections = [
  { name: 's1', titleKey: 'helpDocs.staff.sec1Title', bodyKey: 'helpDocs.staff.sec1Body' },
  { name: 's2', titleKey: 'helpDocs.staff.sec2Title', bodyKey: 'helpDocs.staff.sec2Body' },
  { name: 's3', titleKey: 'helpDocs.staff.sec3Title', bodyKey: 'helpDocs.staff.sec3Body' },
  { name: 's4', titleKey: 'helpDocs.staff.sec4Title', bodyKey: 'helpDocs.staff.sec4Body' },
  { name: 's5', titleKey: 'helpDocs.staff.sec5Title', bodyKey: 'helpDocs.staff.sec5Body' },
  { name: 's6', titleKey: 'helpDocs.staff.sec6Title', bodyKey: 'helpDocs.staff.sec6Body' },
  { name: 's7', titleKey: 'helpDocs.staff.sec7Title', bodyKey: 'helpDocs.staff.sec7Body' },
  { name: 's8', titleKey: 'helpDocs.staff.sec8Title', bodyKey: 'helpDocs.staff.sec8Body' },
];

const headSections = [
  { name: 'h1', titleKey: 'helpDocs.head.sec1Title', bodyKey: 'helpDocs.head.sec1Body' },
  { name: 'h2', titleKey: 'helpDocs.head.sec2Title', bodyKey: 'helpDocs.head.sec2Body' },
  { name: 'h3', titleKey: 'helpDocs.head.sec3Title', bodyKey: 'helpDocs.head.sec3Body' },
  { name: 'h4', titleKey: 'helpDocs.head.sec4Title', bodyKey: 'helpDocs.head.sec4Body' },
  { name: 'h5', titleKey: 'helpDocs.head.sec5Title', bodyKey: 'helpDocs.head.sec5Body' },
  { name: 'h6', titleKey: 'helpDocs.head.sec6Title', bodyKey: 'helpDocs.head.sec6Body' },
  { name: 'h7', titleKey: 'helpDocs.head.sec7Title', bodyKey: 'helpDocs.head.sec7Body' },
];

const directorSections = [
  { name: 'd1', titleKey: 'helpDocs.director.sec1Title', bodyKey: 'helpDocs.director.sec1Body' },
  { name: 'd2', titleKey: 'helpDocs.director.sec2Title', bodyKey: 'helpDocs.director.sec2Body' },
  { name: 'd3', titleKey: 'helpDocs.director.sec3Title', bodyKey: 'helpDocs.director.sec3Body' },
  { name: 'd4', titleKey: 'helpDocs.director.sec4Title', bodyKey: 'helpDocs.director.sec4Body' },
  { name: 'd5', titleKey: 'helpDocs.director.sec5Title', bodyKey: 'helpDocs.director.sec5Body' },
  { name: 'd6', titleKey: 'helpDocs.director.sec6Title', bodyKey: 'helpDocs.director.sec6Body' },
];

const blocks = [
  {
    icon: Box,
    titleKey: 'helpDocs.block1Title',
    lines: ['helpDocs.block1a', 'helpDocs.block1b', 'helpDocs.block1c'],
  },
  {
    icon: Switch,
    titleKey: 'helpDocs.block2Title',
    lines: ['helpDocs.block2a', 'helpDocs.block2b'],
  },
  {
    icon: List,
    titleKey: 'helpDocs.block3Title',
    lines: ['helpDocs.block3a', 'helpDocs.block3b'],
  },
  {
    icon: DataAnalysis,
    titleKey: 'helpDocs.block4Title',
    lines: ['helpDocs.block4a', 'helpDocs.block4b'],
  },
];
</script>

<style scoped>
.help-page {
  max-width: 920px;
}

.help-page__intro {
  margin-bottom: 20px;
}

.help-page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.help-page__subtitle {
  margin: 8px 0 0;
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.55;
}

.help-page__lead {
  margin: 12px 0 0;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 4px solid #3b82f6;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.55;
}

.help-role-tabs {
  margin-bottom: 28px;
  border-radius: 12px;
  overflow: hidden;
}

.help-role-tabs :deep(.el-tabs__content) {
  padding: 16px 18px 8px;
}

.tab-intro {
  margin: 0 0 14px;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.55;
}

.help-collapse {
  border: none;
}

.help-collapse :deep(.el-collapse-item__header) {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.92rem;
}

.help-body {
  white-space: pre-line;
  font-size: 0.88rem;
  line-height: 1.75;
  color: #475569;
  margin: 0;
  padding-bottom: 4px;
}

.help-page__overview-title {
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.help-page__overview-lead {
  margin: 0 0 16px;
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
}

.help-card {
  margin-bottom: 20px;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
}

.help-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #0f172a;
}

.help-card__icon {
  color: #3b82f6;
}

.help-card__list {
  margin: 0;
  padding-left: 1.15rem;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.65;
}

.help-card__list li {
  margin-bottom: 6px;
}

.help-page__tip {
  margin-top: 8px;
  border-radius: 12px;
}
</style>
