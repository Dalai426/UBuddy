import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateEventDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name?: string;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    vote?: string;
}

export class CityDto {
    event?: CreateEventDto
    name: string
}
