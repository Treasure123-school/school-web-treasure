import { Controller, Post, Delete, Get, Param, Body, UseInterceptors, UploadedFile, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        bucket: {
          type: 'string',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('bucket') bucket: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.filesService.uploadFile(file, bucket, userId);
  }

  @Delete(':bucket/:path')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file' })
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('path') path: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.filesService.deleteFile(bucket, path, userId);
  }

  @Get('presigned/:bucket/:path')
  @ApiOperation({ summary: 'Get presigned URL for file access' })
  async getPresignedUrl(
    @Param('bucket') bucket: string,
    @Param('path') path: string,
  ) {
    return this.filesService.getPresignedUrl(bucket, path);
  }
}
