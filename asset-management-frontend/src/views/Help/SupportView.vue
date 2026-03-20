<template>
  <div class="help-page">
    <div class="help-page__intro">
      <h1 class="help-page__title">
        {{ $t('helpSupport.title') }}
      </h1>
      <p class="help-page__subtitle">
        {{ $t('helpSupport.subtitle') }}
      </p>
    </div>

    <el-row :gutter="20">
      <el-col
        :xs="24"
        :md="10"
      >
        <el-card
          class="support-card"
          shadow="hover"
        >
          <template #header>
            <span class="support-card__title">{{ $t('helpSupport.contactTitle') }}</span>
          </template>
          <div class="support-contact">
            <p>
              <strong>{{ $t('helpSupport.contactLabel') }}</strong>
            </p>
            <p class="support-contact__muted">
              {{ $t('helpSupport.contactHint') }}
            </p>
            <el-divider />
            <p>
              <el-icon class="support-contact__ic"><Message /></el-icon>
              {{ $t('helpSupport.emailLabel') }}
              <a
                class="support-contact__link"
                :href="'mailto:' + supportEmail"
              >{{ supportEmail }}</a>
            </p>
            <p>
              <el-icon class="support-contact__ic"><Phone /></el-icon>
              {{ $t('helpSupport.phoneLabel') }}
              <span class="support-contact__strong">{{ supportPhone }}</span>
            </p>
          </div>
        </el-card>
      </el-col>
      <el-col
        :xs="24"
        :md="14"
      >
        <el-card
          class="support-card"
          shadow="hover"
        >
          <template #header>
            <span class="support-card__title">{{ $t('helpSupport.faqTitle') }}</span>
          </template>
          <el-collapse accordion>
            <el-collapse-item
              v-for="(item, i) in faqKeys"
              :key="i"
              :title="$t(item.q)"
              :name="String(i)"
            >
              <p class="faq-answer">
                {{ $t(item.a) }}
              </p>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Message, Phone } from '@element-plus/icons-vue';

/** Có thể chuyển sang biến môi trường sau (VITE_SUPPORT_EMAIL) */
const supportEmail = 'ththuan@ctec.edu.vn';
const supportPhone = '0944300848';

const faqKeys = [
  { q: 'helpSupport.faq1q', a: 'helpSupport.faq1a' },
  { q: 'helpSupport.faq2q', a: 'helpSupport.faq2a' },
  { q: 'helpSupport.faq3q', a: 'helpSupport.faq3a' },
];
</script>

<style scoped>
.help-page {
  max-width: 1000px;
}

.help-page__intro {
  margin-bottom: 24px;
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
  line-height: 1.5;
}

.support-card {
  margin-bottom: 20px;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
}

.support-card__title {
  font-weight: 700;
  color: #0f172a;
}

.support-contact {
  font-size: 0.92rem;
  color: #334155;
  line-height: 1.6;
}

.support-contact__muted {
  color: #94a3b8;
  font-size: 0.85rem;
  margin-top: 4px;
}

.support-contact__ic {
  vertical-align: middle;
  margin-right: 6px;
  color: #64748b;
}

.support-contact__link {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.support-contact__link:hover {
  text-decoration: underline;
}

.support-contact__strong {
  font-weight: 700;
  color: #0f172a;
}

.faq-answer {
  margin: 0;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.6;
}

:deep(.el-collapse-item__header) {
  font-weight: 600;
  color: #1e293b;
}
</style>
